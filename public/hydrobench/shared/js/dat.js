/**
 * 大断面 DAT：点号,备注,X,Y,Z
 * 起点距投影对齐 cross-section-survey-0718/process_dat.py
 */
(function (global) {
  function decodeBytes(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    try {
      const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(u8);
      if (!/\uFFFD/.test(utf8)) return utf8;
    } catch (_) { /* fall through */ }
    try {
      return new TextDecoder("gbk").decode(u8);
    } catch (_) {
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      try {
        return decodeURIComponent(escape(s));
      } catch (e) {
        return s;
      }
    }
  }

  function parseDATText(text) {
    const rows = [];
    text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (!t) return;
      const parts = t.split(",").map((p) => p.trim());
      if (parts.length < 5) return;
      const no = parseInt(parts[0], 10);
      if (Number.isNaN(no)) return;
      let remark = parts[1] || "";
      if (/水/.test(remark)) remark = "水边";
      const X = parseFloat(parts[2]);
      const Y = parseFloat(parts[3]);
      const Z = parseFloat(parts[4]);
      if ([X, Y, Z].some((v) => Number.isNaN(v))) return;
      rows.push({ 点号: no, 备注: remark, X, Y, Z });
    });
    rows.sort((a, b) => a.点号 - b.点号);
    return rows;
  }

  function addStation(points, opts) {
    opts = opts || {};
    const offsetLimit = opts.offsetLimit != null ? opts.offsetLimit : 10;
    if (!points.length) {
      return { all: [], section: [], waterLevel: null };
    }
    const left =
      points.find((p) => p.点号 === 2) ||
      points.find((p) => p.点号 === points[0].点号) ||
      points[0];
    const right = points[points.length - 1];
    const x0 = left.X;
    const y0 = left.Y;
    const vx = right.X - x0;
    const vy = right.Y - y0;
    const L = Math.hypot(vx, vy) || 1;
    const ux = vx / L;
    const uy = vy / L;
    const nx = -uy;
    const ny = ux;

    const all = points.map((p, i) => {
      const proj = (p.X - x0) * ux + (p.Y - y0) * uy;
      const offset = (p.X - x0) * nx + (p.Y - y0) * ny;
      let seg = 0;
      if (i > 0) {
        const prev = points[i - 1];
        seg = Math.hypot(p.X - prev.X, p.Y - prev.Y);
      }
      let 点类 = Math.abs(offset) > offsetLimit ? "控制点" : "断面点";
      if (p.备注 === "水边") 点类 = "水边";
      return {
        ...p,
        投影距_raw: proj,
        偏距_m: round(offset, 3),
        分段距_m: round(seg, 3),
        点类,
        河底高程_m: p.Z,
      };
    });

    const secRaw = all
      .filter((p) => p.点类 !== "控制点")
      .slice()
      .sort((a, b) => a.投影距_raw - b.投影距_raw);
    const minProj = secRaw.length
      ? Math.min(...secRaw.map((p) => p.投影距_raw))
      : Math.min(...all.map((p) => p.投影距_raw));

    const section = secRaw.map((p) => ({
      ...p,
      起点距_m: round(p.投影距_raw - minProj, 3),
      投影距_m: round(p.投影距_raw - minProj, 3),
    }));

    all.forEach((p) => {
      p.起点距_m = round(p.投影距_raw - minProj, 3);
      p.投影距_m = p.起点距_m;
    });

    const edges = all.filter((p) => p.备注 === "水边");
    const waterLevel =
      edges.length > 0
        ? edges.reduce((s, p) => s + p.Z, 0) / edges.length
        : null;

    return { all, section, waterLevel };
  }

  function areaAtLevel(dist, elev, Z) {
    const n = dist.length;
    if (n < 2) return { A: 0, B: 0 };
    let A = 0;
    for (let i = 0; i < n - 1; i++) {
      const x1 = dist[i];
      const x2 = dist[i + 1];
      const z1 = elev[i];
      const z2 = elev[i + 1];
      const d1 = Math.max(Z - z1, 0);
      const d2 = Math.max(Z - z2, 0);
      if (d1 > 0 || d2 > 0) A += 0.5 * (d1 + d2) * (x2 - x1);
    }
    const xs = [];
    for (let i = 0; i < n - 1; i++) {
      const z1 = elev[i];
      const z2 = elev[i + 1];
      const x1 = dist[i];
      const x2 = dist[i + 1];
      if (Math.abs(z1 - Z) < 1e-9) xs.push(x1);
      if ((z1 - Z) * (z2 - Z) < 0) {
        const t = (Z - z1) / (z2 - z1);
        xs.push(x1 + t * (x2 - x1));
      } else if (Math.abs(z2 - Z) < 1e-9) {
        xs.push(x2);
      }
    }
    const uniq = [...new Set(xs.map((v) => Math.round(v * 1e6) / 1e6))].sort(
      (a, b) => a - b
    );
    let B = 0;
    for (let i = 0; i < uniq.length - 1; i++) {
      const mid = 0.5 * (uniq[i] + uniq[i + 1]);
      if (interp(mid, dist, elev) < Z - 1e-9) B += uniq[i + 1] - uniq[i];
    }
    return { A, B };
  }

  function interp(x, xs, ys) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (let i = 0; i < xs.length - 1; i++) {
      if (x >= xs[i] && x <= xs[i + 1]) {
        const t = (x - xs[i]) / (xs[i + 1] - xs[i] || 1);
        return ys[i] + t * (ys[i + 1] - ys[i]);
      }
    }
    return ys[ys.length - 1];
  }

  function stageAreaCurve(section, n) {
    n = n || 40;
    if (!section.length) return [];
    const dist = section.map((p) => p.起点距_m);
    const elev = section.map((p) => p.河底高程_m);
    const zmin = Math.min(...elev);
    const zmax = Math.max(...elev);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const Z = zmin + 0.01 + ((zmax - zmin - 0.01) * i) / (n - 1 || 1);
      const { A, B } = areaAtLevel(dist, elev, Z);
      rows.push({
        水位_m: round(Z, 3),
        面积_m2: round(A, 3),
        水面宽_m: round(B, 3),
      });
    }
    return rows;
  }

  function round(v, d) {
    const f = Math.pow(10, d);
    return Math.round(v * f) / f;
  }

  function qcPoints(all) {
    const issues = [];
    if (!all.length) {
      issues.push({ level: "error", msg: "无有效测点" });
      return issues;
    }
    all.forEach((p) => {
      if ([p.X, p.Y, p.Z].some((v) => v == null || Number.isNaN(v))) {
        issues.push({ level: "error", msg: `点 ${p.点号} 坐标缺失` });
      }
    });
    const zs = all.map((p) => p.Z).filter((z) => !Number.isNaN(z));
    for (let i = 1; i < zs.length; i++) {
      if (Math.abs(zs[i] - zs[i - 1]) > 20) {
        issues.push({
          level: "warn",
          msg: `相邻点高程突变 >20 m（点序 ${i}/${i + 1}）`,
        });
      }
    }
    const ctrl = all.filter((p) => p.点类 === "控制点");
    if (ctrl.length) {
      issues.push({
        level: "info",
        msg: `${ctrl.length} 个控制点（偏距超限）已排除出断面线`,
      });
    }
    return issues;
  }

  global.HydroDAT = {
    decodeBytes,
    parseDATText,
    addStation,
    areaAtLevel,
    stageAreaCurve,
    qcPoints,
  };
})(typeof window !== "undefined" ? window : globalThis);
