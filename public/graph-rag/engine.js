/**
 * Client-side Graph-RAG: char n-gram TF-IDF + optional 1-hop expansion.
 */
(function (global) {
  function stripNoise(text) {
    return String(text || "")
      .replace(/\[\[[^\]|#]+(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g, (m) => {
        const inner = m.slice(2, -2);
        return inner.split("|")[0].split("#")[0];
      })
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`>~]/g, "")
      .trim();
  }

  function charNgrams(text, minN = 2, maxN = 4) {
    const s = ` ${text.toLowerCase()} `;
    const grams = [];
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= s.length - n; i++) grams.push(s.slice(i, i + n));
    }
    return grams;
  }

  function tfidfVectors(docs) {
    const df = new Map();
    const tfs = docs.map((doc) => {
      const grams = charNgrams(doc);
      const tf = new Map();
      for (const g of grams) tf.set(g, (tf.get(g) || 0) + 1);
      for (const g of tf.keys()) df.set(g, (df.get(g) || 0) + 1);
      return tf;
    });
    const N = docs.length || 1;
    const vocab = [...df.keys()];
    const idf = new Map(vocab.map((g) => [g, Math.log((N + 1) / (df.get(g) + 1)) + 1]));
    const vectors = tfs.map((tf) => {
      const vec = new Map();
      let norm = 0;
      for (const [g, c] of tf) {
        const w = (c / (tf.size || 1)) * (idf.get(g) || 0);
        if (w) {
          vec.set(g, w);
          norm += w * w;
        }
      }
      return { vec, norm: Math.sqrt(norm) || 1 };
    });
    return { vectors, idf };
  }

  function cosine(a, b) {
    let dot = 0;
    const [small, large] = a.vec.size < b.vec.size ? [a, b] : [b, a];
    for (const [g, w] of small.vec) {
      const o = large.vec.get(g);
      if (o) dot += w * o;
    }
    return dot / (a.norm * b.norm || 1);
  }

  function queryVector(query, idf) {
    const grams = charNgrams(query);
    const tf = new Map();
    for (const g of grams) tf.set(g, (tf.get(g) || 0) + 1);
    const vec = new Map();
    let norm = 0;
    for (const [g, c] of tf) {
      const w = (c / (tf.size || 1)) * (idf.get(g) || 0);
      if (w) {
        vec.set(g, w);
        norm += w * w;
      }
    }
    return { vec, norm: Math.sqrt(norm) || 1 };
  }

  function degreeCentrality(ids, edges) {
    const deg = Object.fromEntries(ids.map((id) => [id, 0]));
    for (const e of edges) {
      if (deg[e.from] != null) deg[e.from] += 1;
      if (deg[e.to] != null) deg[e.to] += 1;
    }
    const n = Math.max(ids.length - 1, 1);
    return Object.fromEntries(ids.map((id) => [id, deg[id] / n]));
  }

  function oneHop(seeds, edges) {
    const seedSet = new Set(seeds);
    const reached = new Map();
    for (const e of edges) {
      if (seedSet.has(e.from) && !seedSet.has(e.to)) {
        if (!reached.has(e.to)) reached.set(e.to, new Set());
        reached.get(e.to).add(e.from);
      }
      if (seedSet.has(e.to) && !seedSet.has(e.from)) {
        if (!reached.has(e.from)) reached.set(e.from, new Set());
        reached.get(e.from).add(e.to);
      }
    }
    return reached;
  }

  function bestSnippet(body, query, maxLen = 220) {
    const paras = String(body || "")
      .split(/\n\s*\n/)
      .map((p) => stripNoise(p))
      .map((p) => p.replace(/^#+\s.*/gm, "").replace(/^标签：.*/m, "").trim())
      .filter((p) => p.length >= 20);
    if (!paras.length) return stripNoise(body).slice(0, maxLen);
    const q = query.toLowerCase();
    let best = paras[0];
    let bestScore = -1;
    for (const p of paras) {
      let score = 0;
      if (p.toLowerCase().includes(q)) score += 0.5;
      for (const ch of q) if (p.toLowerCase().includes(ch)) score += 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = p.replace(/\s+/g, " ");
      }
    }
    return best.length > maxLen ? `${best.slice(0, maxLen - 1)}…` : best;
  }

  function createEngine(vault, opts = {}) {
    const notes = vault.notes || [];
    const byId = Object.fromEntries(notes.map((n) => [n.id, n]));
    const ids = notes.map((n) => n.id);
    const edges = vault.resolved_edges || vault.graph?.edges || [];
    const docs = notes.map((n) => stripNoise(`${n.title}\n${n.body}`));
    const { vectors, idf } = tfidfVectors(docs);
    const centrality = degreeCentrality(ids, edges);
    const seedK = opts.seedK ?? 3;
    const finalK = opts.finalK ?? 6;
    const lambdaLink = opts.lambdaLink ?? 0.22;
    const muCentrality = opts.muCentrality ?? 0.08;
    const seedBonus = opts.seedBonus ?? 0.18;

    function retrieve(query, mode = "graph") {
      if (!query.trim() || !ids.length) return [];
      const qv = queryVector(query, idf);
      const sims = vectors.map((v, i) => ({ id: ids[i], sim: cosine(qv, v) }));
      sims.sort((a, b) => b.sim - a.sim);
      const seeds = [];
      const simMap = {};
      for (const row of sims) {
        if (row.sim <= 0 && seeds.length) break;
        simMap[row.id] = row.sim;
        seeds.push(row.id);
        if (seeds.length >= seedK) break;
      }
      if (!seeds.length) {
        for (const row of sims.slice(0, seedK)) {
          simMap[row.id] = row.sim;
          seeds.push(row.id);
        }
      }

      const candidates = {};
      for (const seed of seeds) {
        const note = byId[seed];
        const sim = simMap[seed] || 0;
        candidates[seed] = {
          note_id: seed,
          title: note.title,
          similarity: sim,
          score: sim + seedBonus + muCentrality * (centrality[seed] || 0),
          role: "seed",
          via: [],
        };
      }

      if (mode !== "vector") {
        const neighborMap = oneHop(seeds, edges);
        for (const [nb, viaSet] of neighborMap) {
          const note = byId[nb];
          if (!note) continue;
          const sim = simMap[nb] ?? sims.find((s) => s.id === nb)?.sim ?? 0;
          const via = [...viaSet].sort();
          const linkBonus = lambdaLink * Math.min(1, via.length / Math.max(1, seeds.length));
          candidates[nb] = {
            note_id: nb,
            title: note.title,
            similarity: sim,
            score: 0.55 * sim + linkBonus + muCentrality * (centrality[nb] || 0),
            role: "neighbor",
            via,
          };
        }
      }

      return Object.values(candidates)
        .sort((a, b) => b.score - a.score)
        .slice(0, finalK);
    }

    function answer(query, hits) {
      if (!hits.length) {
        return {
          answer:
            "知识库里没有检索到相关笔记。试着问问「什么是 Graph-RAG」或「双向链接有什么用」。",
          citations: [],
          highlights: { seeds: [], neighbors: [], all: [] },
        };
      }
      const seeds = hits.filter((h) => h.role === "seed").map((h) => h.note_id);
      const neighbors = hits.filter((h) => h.role === "neighbor").map((h) => h.note_id);
      const citations = hits.map((h) => {
        const note = byId[h.note_id];
        const snippet = bestSnippet(note.body, query);
        return {
          id: h.note_id,
          title: h.title,
          role: h.role,
          score: Number(h.score.toFixed(4)),
          similarity: Number(h.similarity.toFixed(4)),
          via: h.via,
          snippet,
        };
      });
      const snippets = citations.map((c) => `【${c.title}】${c.snippet}`);
      const lead = `基于${hits.some((h) => h.role === "neighbor") ? "图谱增强" : "向量"}检索（种子 ${seeds.length} 篇${neighbors.length ? ` + 邻居 ${neighbors.length} 篇` : ""}），与「${query.trim()}」最相关的要点：`;
      return {
        answer: `${lead}\n\n${snippets.join("\n\n")}\n\n——摘自笔记原文，浏览器内离线检索。`,
        citations,
        highlights: { seeds, neighbors, all: hits.map((h) => h.note_id) },
      };
    }

    function ask(query, mode = "graph") {
      const hits = retrieve(query, mode);
      return { query, mode, hits, ...answer(query, hits) };
    }

    return { notes, byId, edges, ask, retrieve };
  }

  global.GraphRagEngine = { createEngine, stripNoise };
})(typeof window !== "undefined" ? window : globalThis);
