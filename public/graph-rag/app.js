(() => {
  const graphEl = document.getElementById("graph");
  const form = document.getElementById("ask-form");
  const queryEl = document.getElementById("query");
  const answerEl = document.getElementById("answer");
  const citationsEl = document.getElementById("citations");
  const noteView = document.getElementById("note-view");
  const noteList = document.getElementById("note-list");
  const noteFilter = document.getElementById("note-filter");
  const askBtn = document.getElementById("ask-btn");
  const resetBtn = document.getElementById("reset-btn");
  const modeBadge = document.getElementById("mode-badge");
  const statNotes = document.getElementById("stat-notes");
  const statEdges = document.getElementById("stat-edges");
  const statBackend = document.getElementById("stat-backend");
  const useLlmEl = document.getElementById("use-llm");

  const COLORS = {
    base: "#d2b76a",
    seed: "#62d29a",
    neighbor: "#7eb8d8",
    dim: "#3a4a42",
    edge: "rgba(238, 244, 239, 0.28)",
    edgeHot: "rgba(98, 210, 154, 0.75)",
  };

  const MODE_LABEL = {
    graph: "1-hop",
    multihop: "多跳",
    pagerank: "PageRank",
    community: "社区",
    vector: "纯向量",
  };

  let engine = null;
  let network = null;
  let nodesDS = null;
  let edgesDS = null;
  let allNodeIds = [];
  let mode = "graph";
  let activeNoteId = null;
  let apiAvailable = false;
  let llmEnabled = false;

  if (new URLSearchParams(location.search).get("embed") === "1") {
    document.body.classList.add("embed");
  }

  function nodeStyle(id, role = "base", dimmed = false) {
    const color =
      role === "seed" ? COLORS.seed : role === "neighbor" ? COLORS.neighbor : COLORS.base;
    return {
      id,
      color: {
        background: dimmed ? COLORS.dim : color,
        border: dimmed ? "#2a3530" : "#101612",
        highlight: { background: color, border: "#fff" },
      },
      font: {
        color: dimmed ? "#6d7f74" : "#f2f7f3",
        face: "DM Sans",
        size: role === "seed" ? 16 : 14,
      },
      borderWidth: role === "seed" ? 3 : 1,
      size: role === "seed" ? 28 : role === "neighbor" ? 22 : 18,
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function showNote(id) {
    const note = engine?.byId?.[id];
    if (!note) return;
    activeNoteId = id;
    noteView.classList.remove("empty");
    noteView.textContent = note.body;
    noteList.querySelectorAll("li").forEach((li) => {
      li.classList.toggle("active", li.dataset.id === id);
    });
  }

  function renderNoteList(filter = "") {
    const q = filter.trim().toLowerCase();
    noteList.innerHTML = "";
    for (const note of engine.notes) {
      const hay = `${note.title} ${(note.tags || []).join(" ")}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const li = document.createElement("li");
      li.dataset.id = note.id;
      li.innerHTML = `<span>${escapeHtml(note.title)}</span><span class="tags">${escapeHtml(
        (note.tags || []).slice(0, 2).join(" ")
      )}</span>`;
      if (note.id === activeNoteId) li.classList.add("active");
      li.addEventListener("click", () => {
        showNote(note.id);
        network?.focus(note.id, {
          scale: 1.2,
          animation: { duration: 350, easingFunction: "easeInOutQuad" },
        });
        network?.selectNodes([note.id]);
      });
      noteList.appendChild(li);
    }
  }

  function clearHighlights() {
    if (!nodesDS) return;
    nodesDS.update(allNodeIds.map((id) => nodeStyle(id)));
    edgesDS.update(
      edgesDS.get().map((e) => ({ id: e.id, color: { color: COLORS.edge }, width: 1 }))
    );
  }

  function applyHighlights(highlights) {
    const seedSet = new Set(highlights.seeds || []);
    const neighborSet = new Set(highlights.neighbors || []);
    const active = new Set(highlights.all || []);
    nodesDS.update(
      allNodeIds.map((id) => {
        if (seedSet.has(id)) return nodeStyle(id, "seed");
        if (neighborSet.has(id)) return nodeStyle(id, "neighbor");
        return nodeStyle(id, "base", active.size > 0);
      })
    );
    edgesDS.update(
      edgesDS.get().map((e) => {
        const hot =
          active.has(e.from) &&
          active.has(e.to) &&
          (seedSet.has(e.from) ||
            seedSet.has(e.to) ||
            neighborSet.has(e.from) ||
            neighborSet.has(e.to));
        return {
          id: e.id,
          color: { color: hot ? COLORS.edgeHot : COLORS.edge },
          width: hot ? 2.5 : 1,
        };
      })
    );
    if (highlights.seeds?.length) {
      network.focus(highlights.seeds[0], {
        scale: 1.15,
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
      });
    }
  }

  function renderCitations(citations) {
    citationsEl.innerHTML = "";
    for (const c of citations) {
      const li = document.createElement("li");
      const via =
        c.via?.length > 0
          ? `<div class="via">经由 ${c.via.map(escapeHtml).join(" → ")}</div>`
          : "";
      const roleLabel =
        {
          seed: "种子",
          neighbor: "1-hop",
          hop2: "2-hop",
          pagerank: "PPR",
          community: "社区",
        }[c.role] || c.role;
      li.innerHTML = `
        <div class="meta">
          <span class="title">${escapeHtml(c.title)}</span>
          <span class="${c.role === "seed" ? "role-seed" : "role-neighbor"}">${roleLabel} · ${
            c.score
          }</span>
        </div>
        <div class="snippet">${escapeHtml(c.snippet)}</div>
        ${via}`;
      li.addEventListener("click", () => showNote(c.id));
      citationsEl.appendChild(li);
    }
  }

  async function askViaApi(query) {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        mode,
        use_llm: Boolean(useLlmEl?.checked),
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  async function ask(query) {
    if (!engine) return;
    askBtn.disabled = true;
    answerEl.classList.remove("empty");
    answerEl.textContent = "检索中…";
    try {
      let data;
      if (apiAvailable) {
        data = await askViaApi(query);
      } else {
        data = engine.ask(query, mode);
        data.provider = "extractive";
        data.used_llm = false;
      }
      answerEl.textContent = data.answer;
      renderCitations(data.citations || []);
      applyHighlights(data.highlights || {});
      const llmTag = data.used_llm ? ` · ${data.provider}` : "";
      modeBadge.textContent = `${MODE_LABEL[mode] || mode}${llmTag}`;
      modeBadge.classList.add("hot");
      if (data.highlights?.all?.length) showNote(data.highlights.all[0]);
    } catch (err) {
      // API failed — fall back to local engine
      try {
        const data = engine.ask(query, mode);
        answerEl.textContent = data.answer + `\n\n（API 失败已回退本地：${err.message}）`;
        renderCitations(data.citations || []);
        applyHighlights(data.highlights || {});
        modeBadge.textContent = `${MODE_LABEL[mode] || mode} · 本地`;
        modeBadge.classList.add("hot");
      } catch (err2) {
        answerEl.textContent = `出错：${err2.message}`;
      }
    } finally {
      askBtn.disabled = false;
    }
  }

  function mountGraph(vault) {
    const g = vault.graph;
    allNodeIds = g.nodes.map((n) => n.id);
    nodesDS = new vis.DataSet(
      g.nodes.map((n) => ({
        ...nodeStyle(n.id),
        label: n.label,
        title: `${n.label}\ndegree ${n.degree}`,
      }))
    );
    edgesDS = new vis.DataSet(
      g.edges.map((e, i) => ({
        id: `e${i}`,
        from: e.from,
        to: e.to,
        color: { color: COLORS.edge },
        width: 1,
      }))
    );
    network = new vis.Network(
      graphEl,
      { nodes: nodesDS, edges: edgesDS },
      {
        physics: {
          barnesHut: {
            gravitationalConstant: -3200,
            centralGravity: 0.35,
            springLength: 140,
            springConstant: 0.04,
          },
          stabilization: { iterations: 120 },
        },
        interaction: { hover: true, tooltipDelay: 120 },
        nodes: { shape: "dot" },
        edges: { smooth: { type: "continuous" } },
      }
    );
    network.on("click", (params) => {
      if (params.nodes.length) showNote(params.nodes[0]);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = queryEl.value.trim();
    if (q) ask(q);
  });

  queryEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  resetBtn.addEventListener("click", () => {
    clearHighlights();
    citationsEl.innerHTML = "";
    modeBadge.textContent = "等待提问";
    modeBadge.classList.remove("hot");
    answerEl.classList.add("empty");
    answerEl.textContent = "选模式后提问。本地服务开启 LLM 时可生成串联回答。";
  });

  document.querySelectorAll(".mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode || "graph";
      document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b === btn));
      const q = queryEl.value.trim();
      if (q) ask(q);
    });
  });

  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      queryEl.value = btn.dataset.q || "";
      ask(queryEl.value);
    });
  });

  noteFilter.addEventListener("input", () => renderNoteList(noteFilter.value));

  async function probeApi() {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) return false;
      const health = await res.json();
      apiAvailable = true;
      llmEnabled = Boolean(health.llm?.enabled);
      statBackend.textContent = llmEnabled ? health.llm.provider : "API";
      if (useLlmEl) {
        useLlmEl.disabled = !llmEnabled;
        useLlmEl.checked = llmEnabled;
        useLlmEl.parentElement.title = llmEnabled
          ? `使用 ${health.llm.provider}`
          : "设置 GRAPH_RAG_LLM=ollama|deepseek 后重启";
      }
      return true;
    } catch {
      apiAvailable = false;
      statBackend.textContent = "静态";
      if (useLlmEl) {
        useLlmEl.disabled = true;
        useLlmEl.checked = false;
      }
      return false;
    }
  }

  async function boot() {
    const res = await fetch("./vault.json");
    if (!res.ok) throw new Error("无法加载 vault.json");
    const vault = await res.json();
    engine = window.GraphRagEngine.createEngine(vault);
    statNotes.textContent = String(vault.notes.length);
    statEdges.textContent = String(vault.graph.edges.length);
    mountGraph(vault);
    renderNoteList();
    await probeApi();
  }

  boot().catch((err) => {
    answerEl.classList.remove("empty");
    answerEl.textContent = `加载失败：${err.message}`;
  });
})();
