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

  function adjacency(ids, edges) {
    const adj = Object.fromEntries(ids.map((id) => [id, new Set()]));
    for (const e of edges) {
      if (adj[e.from] && adj[e.to]) {
        adj[e.from].add(e.to);
        adj[e.to].add(e.from);
      }
    }
    return adj;
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

  function kHop(seeds, edges, hop = 2) {
    const ids = [...new Set(edges.flatMap((e) => [e.from, e.to]).concat(seeds))];
    const adj = adjacency(ids, edges);
    const seedSet = new Set(seeds);
    const best = new Map();
    const queue = [];
    const seen = {};
    for (const s of seeds) {
      queue.push([s, 0, [s]]);
      seen[s] = 0;
    }
    while (queue.length) {
      const [node, dist, path] = queue.shift();
      if (dist >= hop) continue;
      for (const nb of adj[node] || []) {
        const nd = dist + 1;
        if (seen[nb] != null && seen[nb] <= nd) continue;
        seen[nb] = nd;
        const npath = path.concat(nb);
        if (!seedSet.has(nb)) best.set(nb, { dist: nd, path: npath });
        queue.push([nb, nd, npath]);
      }
    }
    return best;
  }

  function personalizedPagerank(seeds, edges, ids, { alpha = 0.85, iters = 40 } = {}) {
    const adj = adjacency(ids, edges);
    const n = ids.length || 1;
    const pers = Object.fromEntries(ids.map((id) => [id, 0]));
    seeds.forEach((s) => {
      if (pers[s] != null) pers[s] = 1 / seeds.length;
    });
    let rank = Object.fromEntries(ids.map((id) => [id, 1 / n]));
    for (let t = 0; t < iters; t++) {
      const next = Object.fromEntries(ids.map((id) => [id, (1 - alpha) * (pers[id] || 0)]));
      for (const u of ids) {
        const nbrs = [...(adj[u] || [])];
        const share = nbrs.length ? (alpha * rank[u]) / nbrs.length : 0;
        if (!nbrs.length) {
          // dangling: distribute by personalization
          for (const v of ids) next[v] += alpha * rank[u] * (pers[v] || 0);
        } else {
          for (const v of nbrs) next[v] += share;
        }
      }
      rank = next;
    }
    return rank;
  }

  function simpleCommunities(ids, edges) {
    // connected-component style fallback + greedy merge by shared edges
    const adj = adjacency(ids, edges);
    const seen = new Set();
    const groups = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      const stack = [id];
      const group = [];
      seen.add(id);
      while (stack.length) {
        const u = stack.pop();
        group.push(u);
        for (const v of adj[u] || []) {
          if (!seen.has(v)) {
            seen.add(v);
            stack.push(v);
          }
        }
      }
      groups.push(group);
    }
    return groups;
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

      if (mode === "graph") {
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
            hop: 1,
          };
        }
      } else if (mode === "multihop") {
        const expanded = kHop(seeds, edges, 2);
        for (const [nb, info] of expanded) {
          const note = byId[nb];
          if (!note) continue;
          const sim = simMap[nb] ?? sims.find((s) => s.id === nb)?.sim ?? 0;
          const decay = info.dist === 1 ? 0.55 : 0.32;
          const via = info.path.slice(0, -1);
          candidates[nb] = {
            note_id: nb,
            title: note.title,
            similarity: sim,
            score: decay * sim + lambdaLink / info.dist + muCentrality * (centrality[nb] || 0),
            role: info.dist === 1 ? "neighbor" : "hop2",
            via,
            hop: info.dist,
          };
        }
      } else if (mode === "pagerank") {
        const pr = personalizedPagerank(seeds, edges, ids);
        const neighborMap = oneHop(seeds, edges);
        for (const id of ids) {
          if (seeds.includes(id)) continue;
          const note = byId[id];
          if (!note) continue;
          const sim = simMap[id] ?? sims.find((s) => s.id === id)?.sim ?? 0;
          const via = [...(neighborMap.get(id) || [])].sort();
          candidates[id] = {
            note_id: id,
            title: note.title,
            similarity: sim,
            score: 0.35 * sim + 1.8 * (pr[id] || 0),
            role: "pagerank",
            via,
            hop: via.length ? 1 : 2,
          };
        }
      } else if (mode === "community") {
        const neighborMap = oneHop(seeds, edges);
        for (const [nb, viaSet] of neighborMap) {
          const note = byId[nb];
          if (!note) continue;
          const sim = simMap[nb] ?? sims.find((s) => s.id === nb)?.sim ?? 0;
          const via = [...viaSet].sort();
          candidates[nb] = {
            note_id: nb,
            title: note.title,
            similarity: sim,
            score: 0.55 * sim + lambdaLink + muCentrality * (centrality[nb] || 0),
            role: "neighbor",
            via,
            hop: 1,
          };
        }
        const groups = simpleCommunities(ids, edges);
        const seedGroups = new Set(
          groups.flatMap((g, i) => (g.some((x) => seeds.includes(x)) ? [i] : []))
        );
        groups.forEach((g, i) => {
          if (!seedGroups.has(i)) return;
          for (const nb of g) {
            if (seeds.includes(nb)) continue;
            const note = byId[nb];
            if (!note) continue;
            const sim = simMap[nb] ?? sims.find((s) => s.id === nb)?.sim ?? 0;
            const score = 0.4 * sim + 0.12 + muCentrality * (centrality[nb] || 0);
            if (!candidates[nb] || score > candidates[nb].score) {
              candidates[nb] = {
                note_id: nb,
                title: note.title,
                similarity: sim,
                score,
                role: "community",
                via: [],
                hop: 0,
              };
            }
          }
        });
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
      const neighbors = hits
        .filter((h) => h.role !== "seed")
        .map((h) => h.note_id);
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
