/** 水位序列整理与截断小数修正 */
(function (global) {
  function fixTruncated(value, reference) {
    if (value == null || value === "") return null;
    const v = Number(value);
    if (Number.isNaN(v)) return null;
    if (v >= 1000) return v;
    if (reference == null || Number.isNaN(reference)) return v;
    const refInt = Math.trunc(reference);
    const cand1 = refInt + v / 100;
    const cand2 = refInt + (v % 100) / 100;
    const best = Math.abs(cand1 - reference) <= Math.abs(cand2 - reference) ? cand1 : cand2;
    if (Math.abs(best - reference) < 5) return Math.round(best * 100) / 100;
    return Math.round(cand1 * 100) / 100;
  }

  /**
   * 解析「日期,水位」或「月,日,水位」或纯水位列
   */
  function parseLevelText(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    const rows = [];
    let ref = null;
    lines.forEach((line, idx) => {
      if (/日期|水位|date|level/i.test(line) && idx === 0) return;
      const parts = line.split(/[,，\t;]+/).map((p) => p.trim()).filter(Boolean);
      if (!parts.length) return;
      let date = null;
      let raw;
      if (parts.length >= 3 && !Number.isNaN(Number(parts[0])) && !Number.isNaN(Number(parts[1]))) {
        date = `${parts[0]}-${String(parts[1]).padStart(2, "0")}`;
        raw = parts[2];
      } else if (parts.length >= 2) {
        date = parts[0];
        raw = parts[1];
      } else {
        date = String(idx + 1);
        raw = parts[0];
      }
      let level = fixTruncated(raw, ref);
      if (level != null) ref = level;
      rows.push({
        日期: date,
        原始值: raw,
        水位_m: level,
      });
    });
    return rows;
  }

  function qcLevels(rows) {
    const issues = [];
    const missing = rows.filter((r) => r.水位_m == null).length;
    if (missing) issues.push({ level: "warn", msg: `缺失水位 ${missing} 条` });
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1].水位_m;
      const b = rows[i].水位_m;
      if (a != null && b != null && Math.abs(b - a) > 3) {
        issues.push({
          level: "warn",
          msg: `${rows[i].日期} 相对前日变幅 ${ (b - a).toFixed(2) } m`,
        });
      }
    }
    const vals = rows.map((r) => r.水位_m).filter((v) => v != null);
    if (vals.length) {
      issues.push({
        level: "info",
        msg: `有效 ${vals.length} 点 · 最高 ${Math.max(...vals).toFixed(2)} · 最低 ${Math.min(...vals).toFixed(2)} · 平均 ${(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)}`,
      });
    }
    return issues;
  }

  /** 简化面积包围法：奇数时段等距近似梯形积分 / Δt */
  function areaEnclosureMean(timesHours, levels) {
    if (levels.length < 2) return levels[0] || null;
    let area = 0;
    for (let i = 0; i < levels.length - 1; i++) {
      const dt = (timesHours[i + 1] - timesHours[i]) || 1;
      area += 0.5 * (levels[i] + levels[i + 1]) * dt;
    }
    const T = timesHours[timesHours.length - 1] - timesHours[0];
    return T > 0 ? area / T : levels[0];
  }

  global.HydroLevel = {
    fixTruncated,
    parseLevelText,
    qcLevels,
    areaEnclosureMean,
  };
})(typeof window !== "undefined" ? window : globalThis);
