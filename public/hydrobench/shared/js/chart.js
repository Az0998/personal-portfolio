/** Canvas 过程线 / 断面图 */
(function (global) {
  function clear(ctx, w, h, bg) {
    ctx.fillStyle = bg || "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }

  function axes(ctx, pad, w, h, xlabel, ylabel) {
    ctx.strokeStyle = "#334";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, h - pad.b);
    ctx.lineTo(w - pad.r, h - pad.b);
    ctx.stroke();
    ctx.fillStyle = "#445";
    ctx.font = "12px sans-serif";
    ctx.fillText(xlabel || "", w / 2 - 20, h - 8);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(ylabel || "", 0, 0);
    ctx.restore();
  }

  function drawSeries(canvas, points, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const pad = { l: 52, r: 16, t: 24, b: 40 };
    clear(ctx, w, h, opts.bg);
    if (!points.length) {
      ctx.fillStyle = "#668";
      ctx.fillText("无数据", w / 2 - 20, h / 2);
      return;
    }
    const xs = points.map((_, i) => i);
    const ys = points.map((p) => (typeof p === "number" ? p : p.y));
    const labels = points.map((p, i) => (p && p.x != null ? p.x : String(i + 1)));
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const yspan = ymax - ymin || 1;
    axes(ctx, pad, w, h, opts.xlabel || "序号", opts.ylabel || "水位 (m)");
    ctx.strokeStyle = opts.color || "#0d6b5c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ys.forEach((y, i) => {
      const px = pad.l + (xs[i] / Math.max(xs.length - 1, 1)) * (w - pad.l - pad.r);
      const py = h - pad.b - ((y - ymin) / yspan) * (h - pad.t - pad.b);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.fillStyle = "#0d6b5c";
    ys.forEach((y, i) => {
      const px = pad.l + (xs[i] / Math.max(xs.length - 1, 1)) * (w - pad.l - pad.r);
      const py = h - pad.b - ((y - ymin) / yspan) * (h - pad.t - pad.b);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#334";
    ctx.font = "11px sans-serif";
    ctx.fillText(ymax.toFixed(2), 8, pad.t + 4);
    ctx.fillText(ymin.toFixed(2), 8, h - pad.b);
    if (labels.length <= 12) {
      labels.forEach((lb, i) => {
        const px = pad.l + (i / Math.max(labels.length - 1, 1)) * (w - pad.l - pad.r);
        ctx.fillText(String(lb).slice(0, 6), px - 12, h - 18);
      });
    }
    if (opts.title) {
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(opts.title, pad.l, 16);
    }
  }

  function drawSection(canvas, section, waterLevel, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const pad = { l: 52, r: 16, t: 28, b: 40 };
    clear(ctx, w, h, opts.bg);
    if (!section || !section.length) {
      ctx.fillStyle = "#668";
      ctx.fillText("无断面数据", w / 2 - 30, h / 2);
      return;
    }
    const xs = section.map((p) => p.起点距_m);
    const zs = section.map((p) => p.河底高程_m);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    let zmin = Math.min(...zs);
    let zmax = Math.max(...zs);
    if (waterLevel != null) {
      zmin = Math.min(zmin, waterLevel);
      zmax = Math.max(zmax, waterLevel);
    }
    const xspan = xmax - xmin || 1;
    const zspan = zmax - zmin || 1;
    const mapX = (x) => pad.l + ((x - xmin) / xspan) * (w - pad.l - pad.r);
    const mapZ = (z) => h - pad.b - ((z - zmin) / zspan) * (h - pad.t - pad.b);

    axes(ctx, pad, w, h, "起点距 (m)", "高程 (m)");

    if (waterLevel != null) {
      ctx.fillStyle = "rgba(56, 152, 196, 0.28)";
      ctx.beginPath();
      ctx.moveTo(mapX(xs[0]), mapZ(zs[0]));
      for (let i = 1; i < xs.length; i++) ctx.lineTo(mapX(xs[i]), mapZ(zs[i]));
      ctx.lineTo(mapX(xs[xs.length - 1]), mapZ(waterLevel));
      ctx.lineTo(mapX(xs[0]), mapZ(waterLevel));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1d7aad";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, mapZ(waterLevel));
      ctx.lineTo(w - pad.r, mapZ(waterLevel));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1d7aad";
      ctx.font = "12px sans-serif";
      ctx.fillText("水位 " + waterLevel.toFixed(2) + " m", pad.l + 8, mapZ(waterLevel) - 6);
    }

    ctx.strokeStyle = "#0d6b5c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const px = mapX(x);
      const py = mapZ(zs[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.fillStyle = "#084d43";
    section.forEach((p) => {
      ctx.beginPath();
      ctx.arc(mapX(p.起点距_m), mapZ(p.河底高程_m), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    if (opts.title) {
      ctx.fillStyle = "#0f1c1a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(opts.title, pad.l, 16);
    }
  }

  function canvasToPNG(canvas, filename) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "chart.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    });
  }

  global.HydroChart = { drawSeries, drawSection, canvasToPNG };
})(typeof window !== "undefined" ? window : globalThis);
