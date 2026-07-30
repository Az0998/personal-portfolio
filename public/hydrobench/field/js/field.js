/* HydroBench Field — fully offline (no CDN) */
(function () {
  const KEY_RECORDS = "fieldRecords";
  const KEY_CHECK = "fieldChecklist";

  const $ = (id) => document.getElementById(id);

  function records() {
    return HydroStorage.load(KEY_RECORDS, []);
  }
  function saveRecords(list) {
    HydroStorage.save(KEY_RECORDS, list);
    renderRecords();
    updateIoStatus();
  }

  /* network badge */
  function updateNet() {
    const online = navigator.onLine;
    const badge = $("netBadge");
    badge.textContent = online ? "可联网 · 仍本地存" : "离线就绪";
    badge.style.background = online ? "#15803d" : "";
  }
  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);
  updateNet();

  /* sheets */
  document.querySelectorAll(".field-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".field-nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".sheet").forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      $("sheet-" + btn.dataset.sheet).classList.add("active");
    });
  });

  /* entry */
  function padNow() {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    $("fTime").value = local.toISOString().slice(0, 16);
  }
  $("fillNow").addEventListener("click", padNow);
  padNow();

  $("entryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const list = records();
    list.unshift({
      id: Date.now().toString(36),
      station: $("fStation").value.trim(),
      run: $("fRun").value.trim(),
      time: $("fTime").value,
      reading: $("fReading").value === "" ? null : Number($("fReading").value),
      level: $("fLevel").value === "" ? null : Number($("fLevel").value),
      note: $("fNote").value.trim(),
    });
    saveRecords(list);
    $("fReading").value = "";
    $("fLevel").value = "";
    $("fNote").value = "";
    HydroStorage.toast("已追加并本地保存");
  });

  function renderRecords() {
    const list = records();
    $("recordList").innerHTML = list.length
      ? list
          .map(
            (r) => `<li>
          <div>
            <strong>${esc(r.station)}</strong>
            ${r.run ? " · " + esc(r.run) : ""}
            <div class="meta">${esc(r.time || "—")}
              · 读数 ${r.reading != null ? r.reading : "—"}
              · 水位 ${r.level != null ? r.level : "—"}
              ${r.note ? " · " + esc(r.note) : ""}
            </div>
          </div>
          <button type="button" class="del" data-id="${r.id}">删</button>
        </li>`
          )
          .join("")
      : "<li><div>暂无记录</div></li>";
    $("recordList").querySelectorAll("button.del").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveRecords(records().filter((r) => r.id !== btn.dataset.id));
        HydroStorage.toast("已删除");
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* quick calc */
  let lastQuick = null;
  const modes = {
    gauge: [
      ["zero", "零点 Z₀ (m)", "100"],
      ["reading", "读数 a (m)", "1.24"],
    ],
    avg: [
      ["a", "水位 1", "35.2"],
      ["b", "水位 2", "35.4"],
    ],
    area: [
      ["t0", "时刻1 (h)", "8"],
      ["z0", "水位1", "35.1"],
      ["t1", "时刻2 (h)", "12"],
      ["z1", "水位2", "35.6"],
      ["t2", "时刻3 (h)", "16"],
      ["z2", "水位3", "35.3"],
    ],
    manning: [
      ["A", "A (m²)", "12"],
      ["P", "P (m)", "10"],
      ["n", "n", "0.03"],
      ["S", "S", "0.001"],
    ],
  };

  function renderQFields() {
    const m = $("qMode").value;
    $("qFields").innerHTML = modes[m]
      .map(
        ([k, label, def]) =>
          `<label>${esc(label)}</label><input data-k="${k}" type="number" step="any" inputmode="decimal" value="${def}" />`
      )
      .join("");
  }
  $("qMode").addEventListener("change", renderQFields);
  renderQFields();

  function readQ() {
    const o = {};
    $("qFields").querySelectorAll("input[data-k]").forEach((inp) => {
      o[inp.dataset.k] = Number(inp.value);
    });
    return o;
  }

  $("qRun").addEventListener("click", () => {
    const m = $("qMode").value;
    const p = readQ();
    let html = "";
    let value = null;
    if (m === "gauge") {
      value = HydroFormulas.stageFromGauge(p.zero, p.reading);
      html = `水位<br><strong>${value.toFixed(3)} m</strong>`;
    } else if (m === "avg") {
      value = 0.5 * (p.a + p.b);
      html = `两点平均<br><strong>${value.toFixed(3)} m</strong>`;
    } else if (m === "area") {
      value = HydroLevel.areaEnclosureMean([p.t0, p.t1, p.t2], [p.z0, p.z1, p.z2]);
      html = `面积包围近似日均<br><strong>${value.toFixed(3)} m</strong>`;
    } else if (m === "manning") {
      const R = HydroFormulas.hydraulicRadius(p.A, p.P);
      value = HydroFormulas.manningQ(p.A, R, p.n, p.S);
      html = `R=${R.toFixed(3)} m<br><strong>Q = ${value.toFixed(3)} m³/s</strong>`;
    }
    lastQuick = { mode: m, value, isLevel: m !== "manning" };
    $("qResult").innerHTML = html;
    HydroStorage.toast("计算完成");
  });

  $("qToLevel").addEventListener("click", () => {
    if (!lastQuick || lastQuick.value == null || !lastQuick.isLevel) {
      return HydroStorage.toast("请先做水位类速算");
    }
    $("fLevel").value = Number(lastQuick.value.toFixed(3));
    document.querySelector('.field-nav button[data-sheet="entry"]').click();
    HydroStorage.toast("已写入录入水位");
  });

  /* checklist */
  const CHECK_DEF = [
    {
      group: "出发前",
      items: ["水尺/测深杆齐全", "记录本与备用笔", "手机电量与离线页已打开", "对讲/安全绳确认"],
    },
    {
      group: "测次中",
      items: ["零点与校核点核对", "读数复读一次", "拍摄水尺近景", "记录流态与天气"],
    },
    {
      group: "收工",
      items: ["数据已本地保存", "照片已入库", "设备清点", "计划回城导入室内台"],
    },
  ];

  function loadCheck() {
    return HydroStorage.load(KEY_CHECK, {});
  }
  function saveCheck(map) {
    HydroStorage.save(KEY_CHECK, map);
  }

  function renderCheck() {
    const map = loadCheck();
    $("checkRoot").innerHTML = CHECK_DEF.map((g, gi) => {
      const rows = g.items
        .map((label, ii) => {
          const id = `${gi}-${ii}`;
          const checked = map[id] ? "checked" : "";
          return `<label><input type="checkbox" data-id="${id}" ${checked} />${esc(label)}</label>`;
        })
        .join("");
      return `<div class="check-group"><h3>${esc(g.group)}</h3>${rows}</div>`;
    }).join("");
    $("checkRoot").querySelectorAll("input[type=checkbox]").forEach((inp) => {
      inp.addEventListener("change", () => {
        const map2 = loadCheck();
        map2[inp.dataset.id] = inp.checked;
        saveCheck(map2);
      });
    });
  }

  $("resetCheck").addEventListener("click", () => {
    saveCheck({});
    renderCheck();
    HydroStorage.toast("清单已重置");
  });

  /* IO */
  function bundle() {
    return {
      type: "hydrobench-field",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: records(),
      checklist: loadCheck(),
    };
  }

  function updateIoStatus() {
    const n = records().length;
    $("ioStatus").textContent = `当前缓存 ${n} 条测次记录 · 键 ${HydroStorage.key(KEY_RECORDS)}`;
  }

  $("exportJson").addEventListener("click", () => {
    HydroStorage.downloadJSON("field_export.json", bundle());
    HydroStorage.toast("JSON 已导出");
  });

  $("exportCsv").addEventListener("click", () => {
    const headers = ["id", "station", "run", "time", "reading", "level", "note"];
    const rows = records();
    HydroStorage.downloadText(
      "field_export.csv",
      HydroCSV.toCSV(headers, rows),
      "text/csv"
    );
    HydroStorage.toast("CSV 已导出");
  });

  const backupBtn = document.createElement("button");
  backupBtn.type = "button";
  backupBtn.className = "secondary";
  backupBtn.textContent = "全量备份";
  backupBtn.addEventListener("click", () => {
    HydroStorage.downloadJSON("hydrobench_backup.json", HydroStorage.snapshot());
    HydroStorage.toast("全量备份已导出");
  });
  $("sheet-io").querySelectorAll(".btn-row")[0].appendChild(backupBtn);

  $("copyJson").addEventListener("click", async () => {
    const text = JSON.stringify(bundle(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      HydroStorage.toast("已复制到剪贴板");
    } catch (_) {
      $("importBox").value = text;
      HydroStorage.toast("无法访问剪贴板，已填入下方文本框");
    }
  });

  $("clearAll").addEventListener("click", () => {
    if (!confirm("确认清空全部测次记录？")) return;
    saveRecords([]);
    HydroStorage.toast("记录已清空");
  });

  $("importBtn").addEventListener("click", () => {
    try {
      const obj = JSON.parse($("importBox").value);
      const list = Array.isArray(obj) ? obj : obj.records;
      if (!Array.isArray(list)) throw new Error("无 records");
      saveRecords(list);
      if (obj.checklist) saveCheck(obj.checklist);
      renderCheck();
      HydroStorage.toast("导入成功");
    } catch (err) {
      HydroStorage.toast("导入失败：JSON 格式不正确");
    }
  });

  renderRecords();
  renderCheck();
  updateIoStatus();
  if (HydroStorage.mountBanner) HydroStorage.mountBanner(".field-main");
})();
