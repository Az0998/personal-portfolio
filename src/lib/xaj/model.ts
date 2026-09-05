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
  K: 0.55,
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
  K: 0.58,
  B: 0.28,
  WUM: 18,
  WLM: 65,
  SM: 24,
  KI: 0.32,
  KG: 0.38,
  CS: 0.68,
  CG: 0.978,
};

export type ParamGroupId = "evap" | "tension" | "free" | "routing";

export const PARAM_GROUPS: {
  id: ParamGroupId;
  title: string;
  hint: string;
}[] = [
  { id: "evap", title: "蒸发", hint: "蒸散发能力折算" },
  { id: "tension", title: "张力水 / 产流", hint: "蓄满产流与分层张力水" },
  { id: "free", title: "自由水 / 分水源", hint: "地表 · 壤中 · 地下划分" },
  { id: "routing", title: "汇流", hint: "线性水库与滞时" },
];

export const PARAM_DOCS: {
  key: keyof XajParams;
  symbol: string;
  zh: string;
  unit: string;
  meaning: string;
  group: ParamGroupId;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "K",
    symbol: "K",
    zh: "蒸发折算系数",
    unit: "—",
    meaning: "潜在蒸发 → 流域蒸散发能力",
    group: "evap",
    min: 0.05,
    max: 1.5,
    step: 0.01,
  },
  {
    key: "C",
    symbol: "C",
    zh: "深层蒸散发系数",
    unit: "—",
    meaning: "上层偏干时深层蒸发折减",
    group: "evap",
    min: 0,
    max: 0.35,
    step: 0.01,
  },
  {
    key: "B",
    symbol: "B",
    zh: "蓄水容量曲线指数",
    unit: "—",
    meaning: "张力水蓄满曲线形状（空间不均）",
    group: "tension",
    min: 0.05,
    max: 0.8,
    step: 0.01,
  },
  {
    key: "IMP",
    symbol: "IMP",
    zh: "不透水面积比",
    unit: "—",
    meaning: "直接产流面积占比",
    group: "tension",
    min: 0,
    max: 0.35,
    step: 0.005,
  },
  {
    key: "WUM",
    symbol: "WUM",
    zh: "上层张力水容量",
    unit: "mm",
    meaning: "上层张力水最大蓄量",
    group: "tension",
    min: 1,
    max: 120,
    step: 0.5,
  },
  {
    key: "WLM",
    symbol: "WLM",
    zh: "下层张力水容量",
    unit: "mm",
    meaning: "下层张力水最大蓄量",
    group: "tension",
    min: 5,
    max: 200,
    step: 1,
  },
  {
    key: "WDM",
    symbol: "WDM",
    zh: "深层张力水容量",
    unit: "mm",
    meaning: "深层张力水最大蓄量",
    group: "tension",
    min: 5,
    max: 200,
    step: 1,
  },
  {
    key: "SM",
    symbol: "SM",
    zh: "自由水蓄水容量",
    unit: "mm",
    meaning: "产流后自由水水库容量",
    group: "free",
    min: 1,
    max: 100,
    step: 0.5,
  },
  {
    key: "EX",
    symbol: "EX",
    zh: "自由水容量曲线指数",
    unit: "—",
    meaning: "自由水蓄满曲线形状",
    group: "free",
    min: 0.5,
    max: 2.5,
    step: 0.05,
  },
  {
    key: "KI",
    symbol: "KI",
    zh: "壤中流出流系数",
    unit: "1/d",
    meaning: "自由水划分到壤中流的日比例",
    group: "free",
    min: 0,
    max: 0.7,
    step: 0.01,
  },
  {
    key: "KG",
    symbol: "KG",
    zh: "地下出流系数",
    unit: "1/d",
    meaning: "自由水划分到地下水的日比例",
    group: "free",
    min: 0,
    max: 0.7,
    step: 0.01,
  },
  {
    key: "CS",
    symbol: "CS",
    zh: "地表汇流消退",
    unit: "—",
    meaning: "地表线性水库消退系数",
    group: "routing",
    min: 0,
    max: 0.99,
    step: 0.01,
  },
  {
    key: "CI",
    symbol: "CI",
    zh: "壤中流消退",
    unit: "—",
    meaning: "壤中流线性水库消退系数",
    group: "routing",
    min: 0,
    max: 0.99,
    step: 0.01,
  },
  {
    key: "CG",
    symbol: "CG",
    zh: "地下水消退",
    unit: "—",
    meaning: "地下径流消退系数（基流）",
    group: "routing",
    min: 0.5,
    max: 0.999,
    step: 0.001,
  },
  {
    key: "L",
    symbol: "L",
    zh: "地表滞时",
    unit: "d",
    meaning: "地表波到达出口的滞后天数",
    group: "routing",
    min: 0,
    max: 10,
    step: 1,
  },
  {
    key: "area_km2",
    symbol: "A",
    zh: "流域面积",
    unit: "km²",
    meaning: "径流深 → 流量换算",
    group: "routing",
    min: 1,
    max: 1e6,
    step: 1,
  },
];

export function paramsNearlyEqual(a: XajParams, b: XajParams, eps = 1e-6): boolean {
  for (const d of PARAM_DOCS) {
    if (Math.abs(a[d.key] - b[d.key]) > eps) return false;
  }
  return true;
}

/** Frontend bounds + cross-param checks. Empty array = OK. */
export function validateXajParams(p: XajParams): string[] {
  const errs: string[] = [];
  for (const d of PARAM_DOCS) {
    const v = p[d.key];
    if (!Number.isFinite(v)) {
      errs.push(`${d.symbol} 不是有效数字`);
      continue;
    }
    if (v < d.min || v > d.max) {
      errs.push(`${d.symbol} 应在 [${d.min}, ${d.max}] ${d.unit === "—" ? "" : d.unit}`.trim());
    }
  }
  if (Number.isFinite(p.KI) && Number.isFinite(p.KG) && p.KI + p.KG >= 1) {
    errs.push("KI + KG 须 < 1（自由水出流合计）");
  }
  if (Number.isFinite(p.L) && (p.L < 0 || Math.abs(p.L - Math.round(p.L)) > 1e-9)) {
    errs.push("L 须为非负整数（天）");
  }
  return errs;
}

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

/** Tracked storages for schematic mass balance (mm). */
export function storageMm(st: XajState): number {
  let lag = 0;
  for (const x of st.qsLag) lag += x;
  // Soil + free water + surface lag. qs/qi/qg are outflow depths (flux), not extra S.
  return st.wu + st.wl + st.wd + st.s + lag;
}

export type XajStepFlux = {
  q: number;
  pe: number;
  /** Actual ET this step (mm) */
  e: number;
  /** Total runoff generation into free-water path (mm) */
  R: number;
  RS: number;
  RI: number;
  RG: number;
  wu: number;
  wl: number;
  wd: number;
  s: number;
  /** Routed outflow components (mm/d; also linear-reservoir states) */
  qs: number;
  qi: number;
  qg: number;
  storage_mm: number;
  state: XajState;
};

export function stepXaj(
  p: XajParams,
  state: XajState,
  precipMm: number,
  emMm: number
): XajStepFlux {
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

  // Evaporation + PE (do not add P into soil before runoff — avoids double-counting PE)
  let pe = 0;
  let e = 0;
  if (P >= E0) {
    e = E0;
    pe = P - E0;
  } else {
    // P all consumed by ET demand; remainder from tension water layers
    const need = E0 - P;
    let el = 0;
    let ed = 0;
    if (need <= wu) {
      wu -= need;
      e = P + need;
    } else {
      const fromU = wu;
      wu = 0;
      const need2 = need - fromU;
      if (need2 * (wl / Math.max(p.WLM, 1e-6)) <= wl) {
        el = need2 * (wl / p.WLM);
        wl -= el;
      } else {
        el = wl;
        wl = 0;
        ed = Math.min(wd, (need2 - el) * p.C);
        wd -= ed;
      }
      e = P + fromU + el + ed;
    }
    pe = 0;
  }
  wd = clamp(wd, 0, p.WDM);
  wu = clamp(wu, 0, p.WUM);
  wl = clamp(wl, 0, p.WLM);

  // Runoff generation (storage capacity curve) — add PE once here
  let R = 0;
  if (pe > 0) {
    const peImp = pe * p.IMP;
    const pePerv = pe * (1 - p.IMP);
    const W = wu + wl + wd;
    const A = WMM * (1 - Math.pow(Math.max(0, 1 - W / WM), 1 / (1 + p.B)));
    let Rperv = 0;
    if (pePerv > 0) {
      if (pePerv + A >= WMM) Rperv = pePerv - (WM - W);
      else
        Rperv =
          pePerv - (WM - W) + WM * Math.pow(1 - (pePerv + A) / WMM, 1 + p.B);
      Rperv = Math.max(0, Rperv);
      let remain = W + pePerv - Rperv;
      wu = Math.min(p.WUM, remain);
      remain -= wu;
      wl = Math.min(p.WLM, remain);
      remain -= wl;
      wd = Math.min(p.WDM, Math.max(0, remain));
    }
    R = Rperv + peImp;
  }

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

  const next: XajState = { wu, wl, wd, s, qs, qi, qg, qsLag };
  const q = mmToCms(qs + qi + qg, p.area_km2);
  return {
    q,
    pe,
    e,
    R,
    RS,
    RI,
    RG,
    wu,
    wl,
    wd,
    s,
    qs,
    qi,
    qg,
    storage_mm: storageMm(next),
    state: next,
  };
}

export type XajTrace = {
  q: number[];
  e: number[];
  R: number[];
  RS: number[];
  RI: number[];
  RG: number[];
  wu: number[];
  wl: number[];
  wd: number[];
  s: number[];
  qs: number[];
  qi: number[];
  qg: number[];
  storage_mm: number[];
};

export type XajBalance = {
  precip_mm: number;
  et_mm: number;
  runoff_mm: number;
  dS_mm: number;
  residual_mm: number;
  residual_pct_of_P: number;
  /** |residual|/P above this → warn (schematic threshold) */
  warn: boolean;
  note: string;
};

export function runXajTrace(p: XajParams, precip: number[], em: number[]): XajTrace {
  let st = initState(p);
  const n = precip.length;
  const trace: XajTrace = {
    q: new Array(n),
    e: new Array(n),
    R: new Array(n),
    RS: new Array(n),
    RI: new Array(n),
    RG: new Array(n),
    wu: new Array(n),
    wl: new Array(n),
    wd: new Array(n),
    s: new Array(n),
    qs: new Array(n),
    qi: new Array(n),
    qg: new Array(n),
    storage_mm: new Array(n),
  };
  for (let i = 0; i < n; i++) {
    const step = stepXaj(p, st, precip[i] ?? 0, em[i] ?? 0);
    st = step.state;
    trace.q[i] = step.q;
    trace.e[i] = step.e;
    trace.R[i] = step.R;
    trace.RS[i] = step.RS;
    trace.RI[i] = step.RI;
    trace.RG[i] = step.RG;
    trace.wu[i] = step.wu;
    trace.wl[i] = step.wl;
    trace.wd[i] = step.wd;
    trace.s[i] = step.s;
    trace.qs[i] = step.qs;
    trace.qi[i] = step.qi;
    trace.qg[i] = step.qg;
    trace.storage_mm[i] = step.storage_mm;
  }
  return trace;
}

export function runXaj(p: XajParams, precip: number[], em: number[]): number[] {
  return runXajTrace(p, precip, em).q;
}

/**
 * Schematic basin water balance (mm):
 *   ΣP ≈ ΣE + ΣQ_out + (S_end − S_start)
 * S = tension + free water + surface lag queue (mm).
 * Linear-reservoir qs/qi/qg counted as outlet runoff depth Q (not in S);
 * residual may retain a small routing-lag mismatch — warn if |res|/P > threshold.
 */
export function summarizeBalance(
  precip: number[],
  trace: XajTrace,
  initStorageMm: number,
  warnPct = 2
): XajBalance {
  const n = precip.length;
  let P = 0;
  let E = 0;
  let Q = 0;
  for (let i = 0; i < n; i++) {
    P += precip[i] ?? 0;
    E += trace.e[i] ?? 0;
    Q += (trace.qs[i] ?? 0) + (trace.qi[i] ?? 0) + (trace.qg[i] ?? 0);
  }
  const S0 = initStorageMm;
  const S1 = trace.storage_mm[n - 1] ?? S0;
  const dS = S1 - S0;
  const residual = P - E - Q - dS;
  const residual_pct_of_P = P > 1e-6 ? (100 * residual) / P : 0;
  return {
    precip_mm: P,
    et_mm: E,
    runoff_mm: Q,
    dS_mm: dS,
    residual_mm: residual,
    residual_pct_of_P,
    warn: Math.abs(residual_pct_of_P) > warnPct,
    note:
      "示意闭合：P − E − Q − ΔS ≈ 0；S=张力水+自由水+地表滞时队列。汇流线性水库以出流为通量（不入 S），残差通常很小；过大则告警。",
  };
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

/** Kling-Gupta efficiency (2009); optional alongside NSE/RMSE. */
export function kge(obs: number[], sim: number[]): number {
  const n = Math.min(obs.length, sim.length);
  if (n < 2) return NaN;
  let mo = 0;
  let ms = 0;
  for (let i = 0; i < n; i++) {
    mo += obs[i];
    ms += sim[i];
  }
  mo /= n;
  ms /= n;
  let so = 0;
  let ss = 0;
  let cov = 0;
  for (let i = 0; i < n; i++) {
    const do_ = obs[i] - mo;
    const ds = sim[i] - ms;
    so += do_ * do_;
    ss += ds * ds;
    cov += do_ * ds;
  }
  so = Math.sqrt(so / n);
  ss = Math.sqrt(ss / n);
  if (so < 1e-12 || mo === 0) return NaN;
  const r = cov / n / (so * Math.max(ss, 1e-12));
  const alpha = ss / so;
  const beta = ms / mo;
  return 1 - Math.sqrt((r - 1) ** 2 + (alpha - 1) ** 2 + (beta - 1) ** 2);
}

export type ScoreBundle = { NSE: number; RMSE: number; KGE: number };

export function scoreBundle(obs: number[], sim: number[]): ScoreBundle {
  return { NSE: nse(obs, sim), RMSE: rmse(obs, sim), KGE: kge(obs, sim) };
}

export function persistenceForecast(obs: number[]): number[] {
  const out = new Array(obs.length);
  out[0] = obs[0];
  for (let i = 1; i < obs.length; i++) out[i] = obs[i - 1];
  return out;
}

/** Trailing moving-average baseline (causal: uses past + current obs). */
export function movingAverageForecast(obs: number[], window = 3): number[] {
  const w = Math.max(1, Math.round(window));
  const out = new Array(obs.length);
  for (let i = 0; i < obs.length; i++) {
    let s = 0;
    let c = 0;
    for (let k = 0; k < w && i - k >= 0; k++) {
      s += obs[i - k];
      c++;
    }
    out[i] = c ? s / c : obs[i];
  }
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
