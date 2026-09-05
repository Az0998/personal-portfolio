/**
 * Xinanjiang (Zhao) three-source daily model — educational / portfolio implementation.
 * P, EM, R in mm/d; Q in m³/s. Not for operational forecasting.
 */
export type XajParams = {
  K: number;
  B: number;
  IMP: number;
  WUM: number;
  WLM: number;
  WDM: number;
  C: number;
  SM: number;
  EX: number;
  KI: number;
  KG: number;
  CS: number;
  CI: number;
  CG: number;
  L: number;
  area_km2: number;
};

export type XajState = {
  wu: number;
  wl: number;
  wd: number;
  s: number;
  qs: number;
  qi: number;
  qg: number;
  qsLag: number[];
};

export const DEFAULT_XAJ: XajParams = {
  K: 0.85,
  B: 0.3,
  IMP: 0.02,
  WUM: 20,
  WLM: 60,
  WDM: 40,
  C: 0.15,
  SM: 22,
  EX: 1.2,
  KI: 0.3,
  KG: 0.4,
  CS: 0.65,
  CI: 0.82,
  CG: 0.975,
  L: 1,
  area_km2: 1200,
};

/** Hand-calibrated demo params (slightly off truth used in generator). */
export const CALIBRATED_XAJ: XajParams = {
  ...DEFAULT_XAJ,
  K: 0.88,
  B: 0.28,
  WUM: 18,
  WLM: 65,
  SM: 24,
  KI: 0.32,
  KG: 0.38,
  CS: 0.68,
  CG: 0.978,
};

export const PARAM_DOCS: {
  key: keyof XajParams;
  zh: string;
  unit: string;
  meaning: string;
}[] = [
  { key: "K", zh: "蒸发折算系数", unit: "—", meaning: "潜在蒸发 → 流域蒸散发能力" },
  { key: "B", zh: "蓄水容量曲线指数", unit: "—", meaning: "张力水蓄满曲线形状（空间不均）" },
  { key: "IMP", zh: "不透水面积比", unit: "—", meaning: "直接产流面积占比" },
  { key: "WUM", zh: "上层张力水容量", unit: "mm", meaning: "上层张力水最大蓄量" },
  { key: "WLM", zh: "下层张力水容量", unit: "mm", meaning: "下层张力水最大蓄量" },
  { key: "WDM", zh: "深层张力水容量", unit: "mm", meaning: "深层张力水最大蓄量" },
  { key: "C", zh: "深层蒸散发系数", unit: "—", meaning: "上层偏干时深层蒸发折减" },
  { key: "SM", zh: "自由水蓄水容量", unit: "mm", meaning: "产流后自由水水库容量" },
  { key: "EX", zh: "自由水容量曲线指数", unit: "—", meaning: "自由水蓄满曲线形状" },
  { key: "KI", zh: "壤中流出流系数", unit: "1/d", meaning: "自由水划分到壤中流的日比例" },
  { key: "KG", zh: "地下出流系数", unit: "1/d", meaning: "自由水划分到地下水的日比例" },
  { key: "CS", zh: "地表汇流消退", unit: "—", meaning: "地表线性水库消退系数" },
  { key: "CI", zh: "壤中流消退", unit: "—", meaning: "壤中流线性水库消退系数" },
  { key: "CG", zh: "地下水消退", unit: "—", meaning: "地下径流消退系数（基流）" },
  { key: "L", zh: "地表滞时", unit: "d", meaning: "地表波到达出口的滞后天数" },
  { key: "area_km2", zh: "流域面积", unit: "km²", meaning: "径流深→流量换算" },
];

export function mmToCms(rMm: number, areaKm2: number) {
  return (rMm * areaKm2) / 86.4;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function initState(p: XajParams): XajState {
  const L = Math.max(1, Math.round(p.L));
  return {
    wu: p.WUM * 0.65,
    wl: p.WLM * 0.55,
    wd: p.WDM * 0.45,
    s: p.SM * 0.15,
    qs: 0,
    qi: 0,
    qg: 0,
    qsLag: Array(L).fill(0),
  };
}

export function stepXaj(
  p: XajParams,
  state: XajState,
  precipMm: number,
  emMm: number
): { q: number; pe: number; state: XajState } {
  const P = Math.max(0, precipMm);
  const E0 = Math.max(0, emMm) * p.K;
  const WM = p.WUM + p.WLM + p.WDM;
  const WMM = WM * (1 + p.B);

  let wu = clamp(state.wu, 0, p.WUM);
  let wl = clamp(state.wl, 0, p.WLM);
  let wd = clamp(state.wd, 0, p.WDM);
  let s = clamp(state.s, 0, p.SM);
  let qs = Math.max(0, state.qs);
  let qi = Math.max(0, state.qi);
  let qg = Math.max(0, state.qg);
  const L = Math.max(1, Math.round(p.L));
  let qsLag = state.qsLag.length === L ? [...state.qsLag] : Array(L).fill(0);

  // Evaporation + PE
  let pe = 0;
  if (P + wu >= E0) {
    const eu = E0;
    wu = wu + P - eu;
    pe = P - E0;
  } else {
    const eu = P + wu;
    wu = 0;
    const need = E0 - eu;
    if (need * (wl / Math.max(p.WLM, 1e-6)) <= wl) {
      const el = need * (wl / p.WLM);
      wl -= el;
    } else {
      const el = wl;
      wl = 0;
      const ed = Math.min(wd, (E0 - eu - el) * p.C);
      wd -= ed;
    }
    pe = 0;
  }
  if (wu > p.WUM) {
    wl += wu - p.WUM;
    wu = p.WUM;
  }
  if (wl > p.WLM) {
    wd += wl - p.WLM;
    wl = p.WLM;
  }
  wd = clamp(wd, 0, p.WDM);

  // Runoff generation (storage capacity curve)
  let R = 0;
  if (pe > 0) {
    const W = wu + wl + wd;
    const A = WMM * (1 - Math.pow(Math.max(0, 1 - W / WM), 1 / (1 + p.B)));
    if (pe + A >= WMM) R = pe - (WM - W);
    else R = pe - (WM - W) + WM * Math.pow(1 - (pe + A) / WMM, 1 + p.B);
    R = Math.max(0, R);
    let remain = W + pe - R;
    wu = Math.min(p.WUM, remain);
    remain -= wu;
    wl = Math.min(p.WLM, remain);
    remain -= wl;
    wd = Math.min(p.WDM, Math.max(0, remain));
  }

  const Rimp = pe > 0 ? pe * p.IMP : 0;
  R = R * (1 - p.IMP) + Rimp;

  // Three sources via free-water reservoir
  let RS = 0;
  let RI = 0;
  let RG = 0;
  if (R > 0) {
    const fr = pe > 0 ? clamp(R / pe, 1e-4, 1) : 1;
    s += R;
    if (s > p.SM) {
      RS = (s - p.SM) * fr;
      s = p.SM;
    }
    RI = s * p.KI;
    RG = s * p.KG;
    if (RI + RG > s) {
      const f = s / (RI + RG);
      RI *= f;
      RG *= f;
    }
    s = Math.max(0, s - RI - RG);
  }

  // Routing
  qsLag.push(RS);
  const rsLag = qsLag.shift() ?? 0;
  qs = p.CS * qs + (1 - p.CS) * rsLag;
  qi = p.CI * qi + (1 - p.CI) * RI;
  qg = p.CG * qg + (1 - p.CG) * RG;

  const q = mmToCms(qs + qi + qg, p.area_km2);
  return {
    q,
    pe,
    state: { wu, wl, wd, s, qs, qi, qg, qsLag },
  };
}

export function runXaj(p: XajParams, precip: number[], em: number[]): number[] {
  let st = initState(p);
  const out: number[] = [];
  for (let i = 0; i < precip.length; i++) {
    const step = stepXaj(p, st, precip[i] ?? 0, em[i] ?? 0);
    st = step.state;
    out.push(step.q);
  }
  return out;
}

export function nse(obs: number[], sim: number[]): number {
  const n = Math.min(obs.length, sim.length);
  if (n < 2) return NaN;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += obs[i];
  mean /= n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (obs[i] - sim[i]) ** 2;
    den += (obs[i] - mean) ** 2;
  }
  return den < 1e-12 ? NaN : 1 - num / den;
}

export function rmse(obs: number[], sim: number[]): number {
  const n = Math.min(obs.length, sim.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (obs[i] - sim[i]) ** 2;
  return Math.sqrt(s / n);
}

export function persistenceForecast(obs: number[]): number[] {
  const out = new Array(obs.length);
  out[0] = obs[0];
  for (let i = 1; i < obs.length; i++) out[i] = obs[i - 1];
  return out;
}

/** Lagged ridge-style day-ahead predictor (schematic LSTM stand-in, transparent). */
export function fitLagModel(
  precip: number[],
  obs: number[],
  lags = 7
): {
  /** recursive (simulation mode) */
  predict: (p: number[], q: number[]) => number[];
  /** one-step with observed lags (fairer day-ahead metric) */
  predictTeacher: (p: number[], q: number[]) => number[];
  weights: number[];
} {
  const rows: number[][] = [];
  const y: number[] = [];
  for (let t = lags; t < obs.length; t++) {
    const x: number[] = [1];
    for (let k = 0; k < lags; k++) x.push(precip[t - k] ?? 0);
    for (let k = 1; k <= Math.min(3, lags); k++) x.push(obs[t - k] ?? 0);
    rows.push(x);
    y.push(obs[t]);
  }
  const m = rows[0]?.length ?? 1;
  const lambda = 1e-2;
  const xtx: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const xty: number[] = Array(m).fill(0);
  for (let i = 0; i < rows.length; i++) {
    for (let a = 0; a < m; a++) {
      xty[a] += rows[i][a] * y[i];
      for (let b = 0; b < m; b++) xtx[a][b] += rows[i][a] * rows[i][b];
    }
  }
  for (let a = 0; a < m; a++) xtx[a][a] += lambda;
  const w = solveLinear(xtx, xty);

  const score = (pArr: number[], qHist: number[], t: number) => {
    let s = w[0];
    let j = 1;
    for (let k = 0; k < lags; k++) s += w[j++] * (pArr[t - k] ?? 0);
    for (let k = 1; k <= Math.min(3, lags); k++) s += w[j++] * (qHist[t - k] ?? 0);
    return Math.max(0, s);
  };

  const predict = (pArr: number[], qArr: number[]) => {
    const out = qArr.slice();
    for (let t = lags; t < pArr.length; t++) out[t] = score(pArr, out, t);
    return out;
  };

  const predictTeacher = (pArr: number[], qArr: number[]) => {
    const out = qArr.slice();
    for (let t = lags; t < pArr.length; t++) out[t] = score(pArr, qArr, t);
    return out;
  };

  return { predict, predictTeacher, weights: w };
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const div = M[col][col] || 1e-12;
    for (let c = col; c <= n; c++) M[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}
