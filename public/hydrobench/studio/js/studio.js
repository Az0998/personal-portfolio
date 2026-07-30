/* HydroBench Studio */
(function () {
  const state = {
    kind: null, // dat | level | csv
    dat: null,
    levels: null,
    csv: null,
    stageCurve: null,
    marks: [],
    img: null,
    formulaId: "trap",
  };

  const $ = (id) => document.getElementById(id);

  /* —— tabs —— */
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $("panel-" + btn.dataset.tab).classList.add("active");
    });
  });

  /* —— table helpers —— */
  function renderTable(headers, rows) {
    const thead = $("dataTable").querySelector("thead");
    const tbody = $("dataTable").querySelector("tbody");
    thead.innerHTML = "<tr>" + headers.map((h) => `<th>${esc(h)}</th>`).join("") + "</tr>";
    tbody.innerHTML = rows
      .slice(0, 500)
      .map(
        (r) =>
          "<tr>" +
          headers.map((h) => `<td>${esc(fmt(r[h]))}</td>`).join("") +
          "</tr>"
      )
      .join("");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function fmt(v) {
    if (typeof v === "number" && !Number.isInteger(v)) return Number(v.toFixed(4));
    return v;
  }

  function showIssues(list) {
    $("qcList").innerHTML = list
      .map((i) => `<li class="${i.level}">${esc(i.msg)}</li>`)
      .join("");
  }

  function setKind(label) {
    $("dataKind").textContent = label;
  }

  /* —— DAT —— */
  function ingestDAT(text) {
    const raw = HydroDAT.parseDATText(text);
    const packed = HydroDAT.addStation(raw);
    state.kind = "dat";
    state.dat = packed;
    state.stageCurve = HydroDAT.stageAreaCurve(packed.section);
    const headers = ["点号", "备注", "X", "Y", "Z", "起点距_m", "偏距_m", "点类"];
    renderTable(headers, packed.all);
    showIssues(HydroDAT.qcPoints(packed.all));
    const wl = packed.waterLevel;
    setKind(
      `大断面 DAT · ${packed.all.length} 点 · 断面 ${packed.section.length}` +
        (wl != null ? ` · 水位 ${wl.toFixed(2)} m` : "")
    );
    HydroChart.drawSection($("previewChart"), packed.section, wl, {
      title: "大断面剖面（预览）",
    });
    HydroStorage.toast("DAT 已解析");
  }

  function ingestLevel(text) {
    const rows = HydroLevel.parseLevelText(text);
    state.kind = "level";
    state.levels = rows;
    state.dat = null;
    renderTable(["日期", "原始值", "水位_m"], rows);
    showIssues(HydroLevel.qcLevels(rows));
    setKind(`水位序列 · ${rows.length} 条`);
    const pts = rows
      .filter((r) => r.水位_m != null)
      .map((r) => ({ x: r.日期, y: r.水位_m }));
    HydroChart.drawSeries($("previewChart"), pts, { title: "水位过程线（预览）", ylabel: "水位 (m)" });
    HydroStorage.toast("水位已解析");
  }

  function ingestCSV(text) {
    const parsed = HydroCSV.parseCSV(text);
    state.kind = "csv";
    state.csv = parsed;
    // try detect level-like
    const h = parsed.headers.map((x) => x.toLowerCase());
    const levelKey = parsed.headers.find((x) => /水位|level|z/i.test(x));
    const dateKey = parsed.headers.find((x) => /日期|date|时间/i.test(x));
    if (levelKey) {
      const asLevel = parsed.rows.map((r, i) => ({
        日期: dateKey ? r[dateKey] : String(i + 1),
        原始值: r[levelKey],
        水位_m: HydroLevel.fixTruncated(r[levelKey], null),
      }));
      let ref = null;
      asLevel.forEach((row) => {
        row.水位_m = HydroLevel.fixTruncated(row.原始值, ref);
        if (row.水位_m != null) ref = row.水位_m;
      });
      state.kind = "level";
      state.levels = asLevel;
      renderTable(["日期", "原始值", "水位_m"], asLevel);
      showIssues(HydroLevel.qcLevels(asLevel));
      setKind(`CSV→水位 · ${asLevel.length} 条`);
      HydroChart.drawSeries(
        $("previewChart"),
        asLevel.filter((r) => r.水位_m != null).map((r) => ({ x: r.日期, y: r.水位_m })),
        { title: "水位过程线", ylabel: "水位 (m)" }
      );
    } else if (parsed.headers.length >= 5 && /点|no|x|y|z/i.test(h.join(","))) {
      ingestDAT(text);
      return;
    } else {
      renderTable(parsed.headers, parsed.rows);
      showIssues([{ level: "info", msg: `通用 CSV · ${parsed.rows.length} 行` }]);
      setKind(`CSV · ${parsed.rows.length} 行`);
      HydroChart.drawSeries($("previewChart"), [], {});
    }
    HydroStorage.toast("CSV 已解析");
  }

  function ingestFieldJSON(obj) {
    const list = Array.isArray(obj) ? obj : obj.records;
    if (!Array.isArray(list)) throw new Error("no records");
    const rows = list.map((r, i) => ({
      日期: r.time || String(i + 1),
      原始值: r.reading != null ? r.reading : "",
      水位_m: r.level != null ? Number(r.level) : HydroLevel.fixTruncated(r.reading, null),
      站名: r.station || "",
      测次: r.run || "",
      备注: r.note || "",
    }));
    state.kind = "level";
    state.levels = rows;
    state.dat = null;
    renderTable(["日期", "站名", "测次", "原始值", "水位_m", "备注"], rows);
    showIssues(HydroLevel.qcLevels(rows));
    setKind(`户外回城导入 · ${rows.length} 条`);
    HydroChart.drawSeries(
      $("previewChart"),
      rows.filter((r) => r.水位_m != null).map((r) => ({ x: r.日期, y: r.水位_m })),
      { title: "户外测次水位", ylabel: "水位 (m)" }
    );
    HydroStorage.toast("户外 JSON 已导入");
  }

  function detectAndIngest(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj && (obj.type === "hydrobench-field" || Array.isArray(obj.records) || Array.isArray(obj))) {
          ingestFieldJSON(obj);
          return;
        }
      } catch (_) { /* fall through */ }
    }
    const first = trimmed.split(/\r?\n/)[0] || "";
    const parts = first.split(",");
    if (parts.length >= 5 && !Number.isNaN(parseInt(parts[0], 10)) && !Number.isNaN(parseFloat(parts[2]))) {
      ingestDAT(text);
    } else if (/水位|日期|,|\t/.test(first) || parts.length >= 2) {
      if (parts.length >= 5) ingestDAT(text);
      else if (/^[\d.]+[,，\t]/.test(first) || /日期|水位/.test(first)) ingestLevel(text);
      else ingestCSV(text);
    } else {
      ingestCSV(text);
    }
  }

  async function readFile(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".dat")) {
      const buf = await file.arrayBuffer();
      const text = HydroDAT.decodeBytes(buf);
      ingestDAT(text);
    } else {
      const text = await file.text();
      if (name.endsWith(".csv")) ingestCSV(text);
      else detectAndIngest(text);
    }
  }

  /* drop / file */
  const drop = $("dropZone");
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
    })
  );
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  });
  $("fileInput").addEventListener("change", () => {
    const f = $("fileInput").files[0];
    if (f) readFile(f);
  });
  $("parsePaste").addEventListener("click", () => {
    const t = $("pasteBox").value;
    if (!t.trim()) return HydroStorage.toast("请先粘贴内容");
    detectAndIngest(t);
  });

  $("loadSampleDat").addEventListener("click", async () => {
    try {
      const res = await fetch("../samples/section_demo.dat");
      ingestDAT(await res.text());
    } catch (_) {
      HydroStorage.toast("无法加载样本（请用本地服务器打开）");
    }
  });
  $("loadSampleCsv").addEventListener("click", async () => {
    try {
      const res = await fetch("../samples/level_demo.csv");
      ingestCSV(await res.text());
    } catch (_) {
      HydroStorage.toast("无法加载样本（请用本地服务器打开）");
    }
  });

  $("exportCsv").addEventListener("click", () => {
    if (state.kind === "dat" && state.dat) {
      const headers = ["点号", "备注", "X", "Y", "Z", "起点距_m", "偏距_m", "点类", "河底高程_m"];
      HydroStorage.downloadText(
        "section_processed.csv",
        HydroCSV.toCSV(headers, state.dat.all),
        "text/csv"
      );
    } else if (state.kind === "level" && state.levels) {
      HydroStorage.downloadText(
        "levels_processed.csv",
        HydroCSV.toCSV(["日期", "原始值", "水位_m"], state.levels),
        "text/csv"
      );
    } else if (state.csv) {
      HydroStorage.downloadText(
        "data_export.csv",
        HydroCSV.toCSV(state.csv.headers, state.csv.rows),
        "text/csv"
      );
    } else {
      return HydroStorage.toast("无数据可导出");
    }
    HydroStorage.toast("CSV 已导出");
  });

  $("exportJson").addEventListener("click", () => {
    const payload = {
      kind: state.kind,
      dat: state.dat,
      levels: state.levels,
      stageCurve: state.stageCurve,
      exportedAt: new Date().toISOString(),
    };
    HydroStorage.downloadJSON("hydrobench_data.json", payload);
    HydroStorage.toast("JSON 已导出");
  });

  $("downloadPreview").addEventListener("click", () => {
    HydroChart.canvasToPNG($("previewChart"), "preview.png");
    HydroStorage.toast("预览图已下载");
  });

  $("sendToCalc").addEventListener("click", () => {
    if (!state.stageCurve || !state.stageCurve.length) {
      return HydroStorage.toast("请先解析大断面 DAT");
    }
    HydroStorage.save("stageCurve", state.stageCurve);
    document.querySelector('.tabs button[data-tab="calc"]').click();
    selectFormula("interp");
    HydroStorage.toast("水位–面积曲线已送入公式台");
  });

  /* —— image annotation —— */
  const anno = $("annoCanvas");
  const actx = anno.getContext("2d");

  function redrawAnno() {
    actx.fillStyle = "#111";
    actx.fillRect(0, 0, anno.width, anno.height);
    if (!state.img) {
      actx.fillStyle = "#889";
      actx.font = "14px sans-serif";
      actx.fillText("上传现场照后在此标注", 20, 40);
      return;
    }
    const b = Number($("bright").value);
    const c = Number($("contrast").value);
    actx.filter = `brightness(${100 + b}%) contrast(${100 + c}%)`;
    const scale = Math.min(anno.width / state.img.width, anno.height / state.img.height);
    const dw = state.img.width * scale;
    const dh = state.img.height * scale;
    const ox = (anno.width - dw) / 2;
    const oy = (anno.height - dh) / 2;
    actx.drawImage(state.img, ox, oy, dw, dh);
    actx.filter = "none";
    state.marks.forEach((m) => {
      actx.fillStyle = "#fbbf24";
      actx.beginPath();
      actx.arc(m.x, m.y, 6, 0, Math.PI * 2);
      actx.fill();
      actx.strokeStyle = "#111";
      actx.stroke();
      actx.fillStyle = "#fff";
      actx.font = "bold 13px sans-serif";
      actx.fillText(m.label, m.x + 10, m.y - 8);
      actx.strokeStyle = "#000";
      actx.lineWidth = 3;
      actx.strokeText(m.label, m.x + 10, m.y - 8);
      actx.fillText(m.label, m.x + 10, m.y - 8);
    });
  }

  $("imgInput").addEventListener("change", () => {
    const f = $("imgInput").files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      state.img = img;
      state.marks = [];
      redrawAnno();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
  ["bright", "contrast"].forEach((id) => $(id).addEventListener("input", redrawAnno));
  $("clearMarks").addEventListener("click", () => {
    state.marks = [];
    redrawAnno();
  });
  anno.addEventListener("click", (e) => {
    if (!state.img) return;
    const rect = anno.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * anno.width;
    const y = ((e.clientY - rect.top) / rect.height) * anno.height;
    const label = $("markLabel").value.trim() || "?";
    state.marks.push({ x, y, label });
    redrawAnno();
  });

  $("exportAnno").addEventListener("click", () => {
    if (!state.img) return HydroStorage.toast("请先上传照片");
    HydroChart.canvasToPNG(anno, "gauge_annotated.png");
    HydroStorage.downloadJSON("gauge_annotated.json", {
      marks: state.marks,
      bright: Number($("bright").value),
      contrast: Number($("contrast").value),
      exportedAt: new Date().toISOString(),
    });
    HydroStorage.toast("标注 PNG + JSON 已导出");
  });

  $("genSection").addEventListener("click", () => {
    if (!state.dat) return HydroStorage.toast("请先在数据台解析 DAT");
    HydroChart.drawSection($("genCanvas"), state.dat.section, state.dat.waterLevel, {
      title: "大断面图",
    });
    HydroStorage.toast("断面图已生成");
  });
  $("genSeries").addEventListener("click", () => {
    if (!state.levels) return HydroStorage.toast("请先解析水位序列");
    HydroChart.drawSeries(
      $("genCanvas"),
      state.levels.filter((r) => r.水位_m != null).map((r) => ({ x: r.日期, y: r.水位_m })),
      { title: "水位过程线", ylabel: "水位 (m)" }
    );
    HydroStorage.toast("过程线已生成");
  });
  $("dlGenChart").addEventListener("click", () => {
    HydroChart.canvasToPNG($("genCanvas"), "hydro_chart.png");
  });

  /* —— formulas —— */
  const fieldMap = {
    trap: [
      ["b", "底宽 b (m)", "4"],
      ["B", "水面宽 B (m)", "8"],
      ["h", "水深 h (m)", "1.5"],
    ],
    manning: [
      ["A", "面积 A (m²)", "12"],
      ["P", "湿周 P (m)", "10"],
      ["n", "糙率 n", "0.03"],
      ["S", "坡降 S", "0.001"],
    ],
    hl: [
      ["zeta", "ζ", "0.5"],
      ["v", "流速 v (m/s)", "1.2"],
      ["g", "g", "9.81"],
    ],
    gauge: [
      ["zero", "零点 Z₀ (m)", "100"],
      ["reading", "读数 a (m)", "1.24"],
    ],
    interp: [
      ["Z", "水位 Z (m)", ""],
    ],
  };

  function selectFormula(id) {
    state.formulaId = id;
    document.querySelectorAll(".formula-card").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });
    const fields = fieldMap[id] || [];
    $("calcFields").innerHTML = fields
      .map(
        ([k, label, def]) =>
          `<label>${esc(label)}<input data-k="${k}" type="number" step="any" value="${esc(def)}" /></label>`
      )
      .join("");
    if (id === "interp") {
      const curve = state.stageCurve || HydroStorage.load("stageCurve", []);
      if (curve.length && !($("calcFields").querySelector('[data-k="Z"]').value)) {
        $("calcFields").querySelector('[data-k="Z"]').value = curve[Math.floor(curve.length / 2)].水位_m;
      }
    }
  }

  function renderFormulaList() {
    $("formulaList").innerHTML = HydroFormulas.CATALOG.map(
      (f) =>
        `<div class="formula-card${f.id === state.formulaId ? " active" : ""}" data-id="${f.id}">
          <div class="name">${esc(f.name)}</div>
          <div class="eq">${esc(f.formula)}</div>
          <div class="note">${esc(f.note)}</div>
        </div>`
    ).join("");
    $("formulaList").querySelectorAll(".formula-card").forEach((el) => {
      el.addEventListener("click", () => selectFormula(el.dataset.id));
    });
  }

  function readFields() {
    const o = {};
    $("calcFields").querySelectorAll("input[data-k]").forEach((inp) => {
      o[inp.dataset.k] = Number(inp.value);
    });
    return o;
  }

  function pushHistory(entry) {
    const hist = HydroStorage.load("calcHistory", []);
    hist.unshift(entry);
    HydroStorage.save("calcHistory", hist.slice(0, 50));
    renderHistory();
  }

  function renderHistory() {
    const hist = HydroStorage.load("calcHistory", []);
    $("calcHistory").innerHTML = hist.length
      ? hist.map((h) => `<div>${esc(h.time)} · ${esc(h.summary)}</div>`).join("")
      : "<div>暂无</div>";
  }

  $("runCalc").addEventListener("click", () => {
    const id = state.formulaId;
    const p = readFields();
    let summary = "";
    let html = "";
    if (id === "trap") {
      const A = HydroFormulas.trapArea(p.b, p.B, p.h);
      html = `梯形过水面积<br><strong>A = ${A.toFixed(4)} m²</strong>`;
      summary = `梯形 A=${A.toFixed(3)}`;
    } else if (id === "manning") {
      const R = HydroFormulas.hydraulicRadius(p.A, p.P);
      const Q = HydroFormulas.manningQ(p.A, R, p.n, p.S);
      html = `水力半径 R = ${R.toFixed(4)} m<br><strong>Q = ${Q.toFixed(4)} m³/s</strong>`;
      summary = `曼宁 Q=${Q.toFixed(3)}`;
    } else if (id === "hl") {
      const h = HydroFormulas.localHeadLoss(p.zeta, p.v, p.g);
      html = `<strong>h_ζ = ${h.toFixed(4)} m</strong>`;
      summary = `局部损失 ${h.toFixed(4)} m`;
    } else if (id === "gauge") {
      const Z = HydroFormulas.stageFromGauge(p.zero, p.reading);
      html = `<strong>Z = ${Z.toFixed(3)} m</strong>`;
      summary = `水位 ${Z.toFixed(3)}`;
    } else if (id === "interp") {
      const curve = state.stageCurve || HydroStorage.load("stageCurve", []);
      if (!curve.length) {
        html = "请先解析大断面并生成水位–面积曲线";
      } else {
        const A = HydroFormulas.areaByStageCurve(p.Z, curve);
        html = `插值于 ${curve.length} 点关系表<br><strong>A(Z=${p.Z}) = ${A.toFixed(4)} m²</strong>`;
        summary = `A(${p.Z})=${A.toFixed(3)}`;
      }
    }
    $("calcResult").innerHTML = html;
    if (summary) {
      pushHistory({ time: new Date().toLocaleString(), summary, id, params: p });
      HydroStorage.toast("计算完成");
    }
  });

  $("clearHist").addEventListener("click", () => {
    HydroStorage.save("calcHistory", []);
    renderHistory();
    HydroStorage.toast("历史已清空");
  });
  $("exportHist").addEventListener("click", () => {
    HydroStorage.downloadJSON("calc_history.json", HydroStorage.load("calcHistory", []));
  });

  renderFormulaList();
  selectFormula("trap");
  renderHistory();
  redrawAnno();
  if (HydroStorage.mountBanner) HydroStorage.mountBanner(".layout");
})();
