/** 水文常用公式（纯 JS，离线） */
(function (global) {
  function trapArea(bottom, top, depth) {
    return 0.5 * (bottom + top) * depth;
  }

  function manningQ(A, R, n, S) {
    if (n <= 0 || A <= 0 || R <= 0 || S < 0) return NaN;
    return (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
  }

  function hydraulicRadius(A, P) {
    if (P <= 0) return NaN;
    return A / P;
  }

  /** 局部水头损失 ζ v² / (2g) */
  function localHeadLoss(zeta, v, g) {
    g = g || 9.81;
    return zeta * (v * v) / (2 * g);
  }

  function stageFromGauge(zero, reading) {
    return Number(zero) + Number(reading);
  }

  function interpXY(x, xs, ys) {
    if (!xs.length) return NaN;
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

  function areaByStageCurve(Z, curve) {
    const xs = curve.map((r) => r.水位_m);
    const ys = curve.map((r) => r.面积_m2);
    return interpXY(Z, xs, ys);
  }

  const CATALOG = [
    {
      id: "trap",
      name: "梯形过水面积",
      formula: "A = ½ (b + B) h",
      note: "b 底宽，B 水面宽，h 水深",
    },
    {
      id: "manning",
      name: "曼宁公式流量",
      formula: "Q = (1/n) A R^(2/3) S^(1/2)",
      note: "R = A/P，S 为水力坡降",
    },
    {
      id: "hl",
      name: "局部水头损失",
      formula: "h_ζ = ζ v² / (2g)",
      note: "g ≈ 9.81 m/s²",
    },
    {
      id: "gauge",
      name: "水尺读数→水位",
      formula: "Z = Z₀ + a",
      note: "Z₀ 水尺零点，a 读数",
    },
    {
      id: "interp",
      name: "水位–面积插值",
      formula: "A(Z) 线性插值于关系表",
      note: "需先有断面水位–面积曲线",
    },
  ];

  global.HydroFormulas = {
    trapArea,
    manningQ,
    hydraulicRadius,
    localHeadLoss,
    stageFromGauge,
    areaByStageCurve,
    interpXY,
    CATALOG,
  };
})(typeof window !== "undefined" ? window : globalThis);
