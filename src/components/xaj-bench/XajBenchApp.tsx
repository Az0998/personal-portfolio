"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CALIBRATED_XAJ,
  DEFAULT_XAJ,
  PARAM_DOCS,
  PARAM_GROUPS,
  initState,
  paramsNearlyEqual,
  runXajTrace,
  storageMm,
  summarizeBalance,
  validateXajParams,
  type XajParams,
  fitLagModel,
  nse,
  movingAverageForecast,
  persistenceForecast,
  rmse,
  runXaj,
  scoreBundle,
  type ScoreBundle,
} from "@/lib/xaj/model";

type ProtocolInfo = {
  forcing_seed: number;
  noise_seed: number;
  n_days: number;
  noise: {
    type: string;
    mult_uniform: number[];
    add_gaussian_sigma_m3s: number;
    formula: string;
  };
  warmup_days: number;
  holdout_days: number;
  metric_unit: string;
  metric_periods: { post_warmup: string; holdout_tail: string };
  obs_generation: string;
  baselines: string[];
};

type BenchPayload = {
  basin: {
    name: string;
    area_km2: number;
    schematic: boolean;
    note: string;
  };
  disclaimer?: string;
  protocol?: ProtocolInfo;
  calibration: { method: string; period: string; notes: string[] };
  params_truth: XajParams;
  params_calibrated: XajParams;
  warmup_days: number;
  holdout_days?: number;
  metrics: Record<string, ScoreBundle>;
  metrics_holdout?: Record<string, ScoreBundle>;
  lstm_note: string;
  series: {
    date: string[];
    precip_mm: number[];
    em_mm: number[];
    q_obs: number[];
    q_xaj: number[];
    q_persistence: number[];
    q_ma3?: number[];
    q_lag_lstm: number[];
  };
};

type SeriesKey = "xaj" | "persistence" | "ma3" | "lag_lstm";
type ParamSource = "truth" | "calibrated" | "editing";
type GuideStepId = "evap" | "runoff" | "routing" | null;

type GuideStep = {
  id: Exclude<GuideStepId, null>;
  step: number;
  title: string;
  focus: string;
  observe: string;
  keys: (keyof XajParams)[];
};

const SERIES_META: { key: SeriesKey; label: string; color: string; baseline?: boolean }[] = [
  { key: "xaj", label: "新安江（三水源）", color: "#2ec4b6" },
  { key: "lag_lstm", label: "Lag-LSTM（示意回归）", color: "#5b8def" },
  { key: "ma3", label: "MA3（baseline）", color: "#c9a227", baseline: true },
  { key: "persistence", label: "Persistence（baseline）", color: "#8899aa", baseline: true },
];

/** Fixed evaluation policy — shown in UI; matches generator defaults. */
const EVAL_POLICY = {
  unit: "m³/s",
  warmupDays: 60,
  holdoutDays: 30,
} as const;

/** Aligns with calibration.notes — interview talk track, not optimizer. */
const GUIDE_STEPS: GuideStep[] = [
  {
    id: "evap",
    step: 1,
    title: "蒸发平衡",
    focus: "主调 K（可顺带看 C）",
    observe: "看年蒸发量级是否合理：E 过大则基流偏枯、洪峰易「空」；过小则长期偏湿、洪量偏大。",
    keys: ["K", "C"],
  },
  {
    id: "runoff",
    step: 2,
    title: "产流与涨水",
    focus: "WUM / WLM / WDM、B、不透水比 IMP",
    observe: "看涨水段：起涨早晚、洪量是否贴合蓄满产流；B 管空间不均，IMP 影响小雨即涨。",
    keys: ["WUM", "WLM", "WDM", "B", "IMP"],
  },
  {
    id: "routing",
    step: 3,
    title: "洪峰与基流",
    focus: "SM / KI / KG，以及 CS / CI / CG",
    observe: "看洪峰形态与退水尾部：SM+KI/KG 分水源，CS 管峰形，CG 管基流拖尾。",
    keys: ["SM", "KI", "KG", "CS", "CI", "CG"],
  },
];

const SENSITIVITY_KEYS: (keyof XajParams)[] = [
  "K",
  "B",
  "WUM",
  "WLM",
  "SM",
  "KI",
  "KG",
  "CS",
  "CG",
];

function mergeParams(partial: Partial<XajParams>): XajParams {
  return { ...DEFAULT_XAJ, ...partial };
}

function draftsFromParams(p: XajParams): Record<keyof XajParams, string> {
  const out = {} as Record<keyof XajParams, string>;
  for (const d of PARAM_DOCS) out[d.key] = String(p[d.key]);
  return out;
}

function formatMetric(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(3);
}

function formatRmse(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(2);
}

function formatDelta(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(3)}`;
}

function clampParam(key: keyof XajParams, value: number): number {
  const doc = PARAM_DOCS.find((d) => d.key === key);
  if (!doc) return value;
  let v = Math.max(doc.min, Math.min(doc.max, value));
  if (key === "L") v = Math.round(v);
  return v;
}

function xajNseAfterWarmup(
  p: XajParams,
  precip: number[],
  em: number[],
  obs: number[],
  warm: number
): number {
  const q = runXaj(p, precip, em);
  return nse(obs.slice(warm), q.slice(warm));
}

function formatKge(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(3);
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function drawChart(
  canvas: HTMLCanvasElement,
  opts: {
    precip: number[];
    obs: number[];
    series: { values: number[]; color: string; visible: boolean }[];
    start: number;
    end: number;
    warmupDays: number;
    holdoutDays?: number;
  }
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const { start, end, precip, obs, series, warmupDays, holdoutDays = 0 } = opts;
  const n = end - start;
  if (n < 2) return;
  const pad = { l: 48, r: 16, t: 16, b: 36 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const finiteSlice = (arr: number[]) =>
    arr.slice(start, end).filter((x) => Number.isFinite(x));
  const qMax = Math.max(
    1,
    ...finiteSlice(obs),
    ...series.flatMap((s) => (s.visible ? finiteSlice(s.values) : [0]))
  );
  const pMax = Math.max(1, ...finiteSlice(precip));

  const barH = plotH * 0.22;
  const y0 = pad.t + barH + 8;
  const qH = plotH - barH - 8;
  const yAt = (q: number) => y0 + (1 - q / qMax) * qH;
  const xAt = (i: number) => pad.l + (i / (n - 1)) * plotW;

  // Warmup band (absolute days [0, warmupDays) ∩ visible window)
  const warmEndAbs = Math.min(warmupDays, end);
  if (warmEndAbs > start) {
    const i0 = 0;
    const i1 = Math.max(0, warmEndAbs - start - 1);
    const x0 = xAt(i0);
    const x1 = xAt(Math.min(i1, n - 1));
    ctx.fillStyle = "rgba(255, 209, 102, 0.12)";
    ctx.fillRect(x0, pad.t, Math.max(2, x1 - x0), plotH);
    ctx.fillStyle = "rgba(255, 209, 102, 0.55)";
    ctx.font = "10px ui-sans-serif, system-ui";
    ctx.fillText(`暖期 0–${warmupDays}d（不计指标）`, x0 + 4, pad.t + 12);
  }

  // Holdout tail band
  if (holdoutDays > 0) {
    const holdStartAbs = Math.max(0, end - holdoutDays);
    if (holdStartAbs < end && holdStartAbs < end) {
      const i0 = Math.max(0, holdStartAbs - start);
      const i1 = n - 1;
      if (i0 <= i1 && holdStartAbs < end) {
        const x0 = xAt(i0);
        const x1 = xAt(i1);
        ctx.fillStyle = "rgba(91, 141, 239, 0.1)";
        ctx.fillRect(x0, pad.t, Math.max(2, x1 - x0), plotH);
        ctx.fillStyle = "rgba(91, 141, 239, 0.65)";
        ctx.font = "10px ui-sans-serif, system-ui";
        ctx.fillText(`留出末${holdoutDays}d`, Math.max(pad.l, x0 + 4), pad.t + 24);
      }
    }
  }

  ctx.fillStyle = "rgba(91, 141, 239, 0.35)";
  for (let i = 0; i < n; i++) {
    const x = pad.l + (i / (n - 1)) * plotW;
    const ph = ((precip[start + i] ?? 0) / pMax) * barH;
    ctx.fillRect(x - 1, pad.t + barH - ph, 2, ph);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  for (let g = 0; g <= 4; g++) {
    const y = y0 + (g / 4) * qH;
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
  }
  ctx.stroke();

  const drawLine = (vals: number[], color: string, width = 1.8) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = vals[start + i];
      if (!Number.isFinite(v)) {
        started = false;
        continue;
      }
      const x = xAt(i);
      const y = yAt(v);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawLine(obs, "#ffd166", 2.2);
  for (const s of series) {
    if (s.visible) drawLine(s.values, s.color);
  }

  ctx.fillStyle = "#7a9eab";
  ctx.font = "11px ui-sans-serif, system-ui";
  ctx.fillText(`${qMax.toFixed(0)} m³/s`, 6, y0 + 10);
  ctx.fillText("0", 18, y0 + qH);
  ctx.fillText("P", pad.l, pad.t + 10);
}

function drawStackedSources(
  canvas: HTMLCanvasElement,
  opts: {
    RS: number[];
    RI: number[];
    RG: number[];
    start: number;
    end: number;
  }
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const { start, end, RS, RI, RG } = opts;
  const n = end - start;
  if (n < 2) return;
  const pad = { l: 44, r: 12, t: 18, b: 28 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  let yMax = 1e-6;
  for (let i = start; i < end; i++) {
    yMax = Math.max(yMax, (RS[i] ?? 0) + (RI[i] ?? 0) + (RG[i] ?? 0));
  }

  const xAt = (i: number) => pad.l + (i / (n - 1)) * plotW;
  const yAt = (v: number) => pad.t + (1 - v / yMax) * plotH;

  const layers: { vals: number[]; color: string; label: string }[] = [
    { vals: RG, color: "rgba(70, 130, 180, 0.75)", label: "地下 RG" },
    { vals: RI, color: "rgba(46, 196, 182, 0.75)", label: "壤中 RI" },
    { vals: RS, color: "rgba(255, 140, 66, 0.8)", label: "地表 RS" },
  ];

  // Stack from bottom: RG, RI, RS
  const cum = new Array(n).fill(0);
  for (const layer of layers) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = xAt(i);
      const y = yAt(cum[i] + (layer.vals[start + i] ?? 0));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = n - 1; i >= 0; i--) {
      const x = xAt(i);
      ctx.lineTo(x, yAt(cum[i]));
    }
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
    for (let i = 0; i < n; i++) cum[i] += layer.vals[start + i] ?? 0;
  }

  ctx.fillStyle = "#7a9eab";
  ctx.font = "10px ui-sans-serif, system-ui";
  ctx.fillText(`${yMax.toFixed(1)} mm`, 4, pad.t + 10);
  ctx.fillText("三水源产流分量（堆叠）", pad.l, 12);
  let lx = pad.l;
  for (const layer of [...layers].reverse()) {
    ctx.fillStyle = layer.color;
    ctx.fillRect(lx, h - 16, 8, 8);
    ctx.fillStyle = "#9bb8c2";
    ctx.fillText(layer.label, lx + 11, h - 9);
    lx += 72;
  }
}

function drawStorageSeries(
  canvas: HTMLCanvasElement,
  opts: {
    wu: number[];
    wl: number[];
    wd: number[];
    s: number[];
    start: number;
    end: number;
  }
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const { start, end, wu, wl, wd, s } = opts;
  const n = end - start;
  if (n < 2) return;
  const pad = { l: 44, r: 12, t: 18, b: 28 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const series = [
    { vals: wu, color: "#7bdff2", label: "WU" },
    { vals: wl, color: "#2ec4b6", label: "WL" },
    { vals: wd, color: "#457b9d", label: "WD" },
    { vals: s, color: "#ffd166", label: "S自由" },
  ];
  let yMax = 1;
  for (const ser of series) {
    for (let i = start; i < end; i++) yMax = Math.max(yMax, ser.vals[i] ?? 0);
  }
  const xAt = (i: number) => pad.l + (i / (n - 1)) * plotW;
  const yAt = (v: number) => pad.t + (1 - v / yMax) * plotH;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  for (let g = 0; g <= 3; g++) {
    const y = pad.t + (g / 3) * plotH;
    ctx.moveTo(pad.l, y);
    ctx.lineTo(pad.l + plotW, y);
  }
  ctx.stroke();

  for (const ser of series) {
    ctx.strokeStyle = ser.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = xAt(i);
      const y = yAt(ser.vals[start + i] ?? 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.fillStyle = "#7a9eab";
  ctx.font = "10px ui-sans-serif, system-ui";
  ctx.fillText(`${yMax.toFixed(0)} mm`, 4, pad.t + 10);
  ctx.fillText("张力水 / 自由水蓄量", pad.l, 12);
  let lx = pad.l;
  for (const ser of series) {
    ctx.fillStyle = ser.color;
    ctx.fillRect(lx, h - 16, 8, 8);
    ctx.fillStyle = "#9bb8c2";
    ctx.fillText(ser.label, lx + 11, h - 9);
    lx += 52;
  }
}

export function XajBenchApp({
  hydroMlUrl = "/presentations/hydro-ml",
  hydroInfoUrl = "/hydrobench?tab=info",
}: {
  hydroMlUrl?: string;
  hydroInfoUrl?: string;
}) {
  const [data, setData] = useState<BenchPayload | null>(null);
  const [error, setError] = useState("");
  const [params, setParams] = useState<XajParams>(CALIBRATED_XAJ);
  const [drafts, setDrafts] = useState(() => draftsFromParams(CALIBRATED_XAJ));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof XajParams, string>>>({});
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    xaj: true,
    persistence: true,
    ma3: false,
    lag_lstm: true,
  });
  const [windowDays, setWindowDays] = useState(730);
  const [guideStep, setGuideStep] = useState<GuideStepId>("evap");
  const [guideOpen, setGuideOpen] = useState(true);
  const [sensKey, setSensKey] = useState<keyof XajParams>("K");
  const [showSources, setShowSources] = useState(true);
  const [showStorage, setShowStorage] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourcesCanvasRef = useRef<HTMLCanvasElement>(null);
  const storageCanvasRef = useRef<HTMLCanvasElement>(null);
  const paramsPanelRef = useRef<HTMLElement>(null);
  const lastValidParams = useRef<XajParams>(CALIBRATED_XAJ);

  const truth = useMemo(
    () => (data ? mergeParams(data.params_truth) : DEFAULT_XAJ),
    [data]
  );
  const calibrated = useMemo(
    () => (data ? mergeParams(data.params_calibrated) : CALIBRATED_XAJ),
    [data]
  );

  const applyParams = useCallback((next: XajParams) => {
    setParams(next);
    setDrafts(draftsFromParams(next));
    setFieldErrors({});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/xaj-bench/benchmark.json");
        if (!res.ok) throw new Error("无法加载 benchmark.json");
        const json = (await res.json()) as BenchPayload;
        if (cancelled) return;
        setData(json);
        applyParams(mergeParams(json.params_calibrated));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyParams]);

  const paramErrors = useMemo(() => validateXajParams(params), [params]);
  const paramsOk = paramErrors.length === 0 && Object.keys(fieldErrors).length === 0;

  useEffect(() => {
    if (paramsOk) lastValidParams.current = params;
  }, [params, paramsOk]);

  const paramSource: ParamSource = useMemo(() => {
    if (paramsNearlyEqual(params, calibrated)) return "calibrated";
    if (paramsNearlyEqual(params, truth)) return "truth";
    return "editing";
  }, [params, calibrated, truth]);

  const activeGuide = GUIDE_STEPS.find((s) => s.id === guideStep) ?? null;
  const highlightKeys = useMemo(
    () => new Set(activeGuide?.keys ?? []),
    [activeGuide]
  );

  const live = useMemo(() => {
    if (!data) return null;
    const runP = paramsOk ? params : lastValidParams.current;
    const { precip_mm, em_mm, q_obs } = data.series;
    const trace = runXajTrace(runP, precip_mm, em_mm);
    const q_xaj = trace.q;
    const q_persistence = persistenceForecast(q_obs);
    const q_ma3 =
      data.series.q_ma3 ?? movingAverageForecast(q_obs, 3);
    const { predictTeacher } = fitLagModel(precip_mm, q_obs, 7);
    const q_lag_lstm = predictTeacher(precip_mm, q_obs);
    const warm = data.warmup_days ?? EVAL_POLICY.warmupDays;
    const holdout = data.holdout_days ?? EVAL_POLICY.holdoutDays;
    const postWarm = <T,>(a: T[]) => a.slice(warm);
    const tail = <T,>(a: T[]) => a.slice(-holdout);
    const pack = (sim: number[]) => ({
      postWarmup: scoreBundle(postWarm(q_obs), postWarm(sim)),
      holdout: scoreBundle(tail(q_obs), tail(sim)),
    });
    const s0 = storageMm(initState(runP));
    const balance = summarizeBalance(precip_mm, trace, s0);
    return {
      q_xaj,
      q_persistence,
      q_ma3,
      q_lag_lstm,
      trace,
      balance,
      warm,
      holdout,
      metrics: {
        xaj: pack(q_xaj),
        persistence: pack(q_persistence),
        ma3: pack(q_ma3),
        lag_lstm: pack(q_lag_lstm),
      },
    };
  }, [data, params, paramsOk]);

  const sensitivity = useMemo(() => {
    if (!data || !paramsOk) return null;
    const { precip_mm, em_mm, q_obs } = data.series;
    const warm = data.warmup_days;
    const base = params[sensKey];
    const baseNse = xajNseAfterWarmup(params, precip_mm, em_mm, q_obs, warm);

    const mk = (factor: number) => {
      const next = { ...params, [sensKey]: clampParam(sensKey, base * factor) };
      // KI+KG constraint: if broken, skip
      const errs = validateXajParams(next);
      if (errs.length) {
        return { value: next[sensKey], nse: NaN, skipped: true as const };
      }
      return {
        value: next[sensKey],
        nse: xajNseAfterWarmup(next, precip_mm, em_mm, q_obs, warm),
        skipped: false as const,
      };
    };

    const down = mk(0.9);
    const up = mk(1.1);
    return { base, baseNse, down, up };
  }, [data, params, paramsOk, sensKey]);

  const range = useMemo(() => {
    if (!data) return { start: 0, end: 0 };
    const end = data.series.q_obs.length;
    const start = Math.max(0, end - windowDays);
    return { start, end };
  }, [data, windowDays]);

  useEffect(() => {
    if (!data || !live || !canvasRef.current) return;
    drawChart(canvasRef.current, {
      precip: data.series.precip_mm,
      obs: data.series.q_obs,
      start: range.start,
      end: range.end,
      warmupDays: live.warm,
      holdoutDays: live.holdout,
      series: SERIES_META.map((m) => ({
        values:
          m.key === "xaj"
            ? live.q_xaj
            : m.key === "persistence"
              ? live.q_persistence
              : m.key === "ma3"
                ? live.q_ma3
                : live.q_lag_lstm,
        color: m.color,
        visible: visible[m.key],
      })),
    });
  }, [data, live, range, visible]);

  useEffect(() => {
    if (!live || !showSources || !sourcesCanvasRef.current) return;
    drawStackedSources(sourcesCanvasRef.current, {
      RS: live.trace.RS,
      RI: live.trace.RI,
      RG: live.trace.RG,
      start: range.start,
      end: range.end,
    });
  }, [live, range, showSources]);

  useEffect(() => {
    if (!live || !showStorage || !storageCanvasRef.current) return;
    drawStorageSeries(storageCanvasRef.current, {
      wu: live.trace.wu,
      wl: live.trace.wl,
      wd: live.trace.wd,
      s: live.trace.s,
      start: range.start,
      end: range.end,
    });
  }, [live, range, showStorage]);

  const onDraftChange = useCallback((key: keyof XajParams, raw: string) => {
    setDrafts((d) => ({ ...d, [key]: raw }));
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
      setFieldErrors((e) => ({ ...e, [key]: "请输入数字" }));
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      setFieldErrors((e) => ({ ...e, [key]: "非法数字" }));
      return;
    }
    const doc = PARAM_DOCS.find((d) => d.key === key);
    if (doc && (n < doc.min || n > doc.max)) {
      setFieldErrors((e) => ({
        ...e,
        [key]: `应在 [${doc.min}, ${doc.max}]`,
      }));
      setParams((p) => ({ ...p, [key]: n }));
      return;
    }
    setFieldErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
    setParams((p) => ({ ...p, [key]: key === "L" ? Math.round(n) : n }));
  }, []);

  const selectGuideStep = (id: Exclude<GuideStepId, null>) => {
    setGuideStep(id);
    setGuideOpen(true);
    setWindowDays(730);
    requestAnimationFrame(() => {
      paramsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const guideIndex = Math.max(
    0,
    GUIDE_STEPS.findIndex((s) => s.id === guideStep)
  );

  const stepGuide = (delta: number) => {
    if (!guideStep) {
      selectGuideStep(GUIDE_STEPS[delta >= 0 ? 0 : GUIDE_STEPS.length - 1].id);
      return;
    }
    const next = Math.min(GUIDE_STEPS.length - 1, Math.max(0, guideIndex + delta));
    selectGuideStep(GUIDE_STEPS[next].id);
  };

  const exportParamsJson = () => {
    if (!data || !live) return;
    const payload = {
      exported_at: new Date().toISOString(),
      param_source: paramSource,
      params_current: params,
      params_truth: truth,
      params_calibrated: calibrated,
      eval: {
        unit: EVAL_POLICY.unit,
        warmup_days: live.warm,
        holdout_days: live.holdout,
        metrics_post_warmup: Object.fromEntries(
          SERIES_META.map((m) => [m.key, live.metrics[m.key].postWarmup])
        ),
        metrics_holdout_tail: Object.fromEntries(
          SERIES_META.map((m) => [m.key, live.metrics[m.key].holdout])
        ),
      },
      protocol: data.protocol ?? null,
      note: "与页面当前过程线一致：XAJ 为当前编辑参数即时重跑；其余序列按观测派生。",
    };
    downloadBlob(
      "xaj-bench-params.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const exportSeriesCsv = () => {
    if (!data || !live) return;
    const { date, precip_mm, em_mm, q_obs } = data.series;
    const t = live.trace;
    const rows = [
      "date,precip_mm,em_mm,q_obs_m3s,q_xaj_m3s,RS_mm,RI_mm,RG_mm,E_mm,storage_mm,q_lag_lstm_m3s,q_persistence_m3s,q_ma3_m3s",
    ];
    for (let i = 0; i < q_obs.length; i++) {
      rows.push(
        [
          date[i] ?? i,
          precip_mm[i],
          em_mm[i],
          q_obs[i],
          live.q_xaj[i],
          t.RS[i],
          t.RI[i],
          t.RG[i],
          t.e[i],
          t.storage_mm[i],
          live.q_lag_lstm[i],
          live.q_persistence[i],
          live.q_ma3[i],
        ].join(",")
      );
    }
    downloadBlob("xaj-bench-hydrograph.csv", rows.join("\n"), "text/csv;charset=utf-8");
  };

  if (error) {
    return (
      <div className="xaj-error">
        <p>{error}</p>
        <p className="xaj-muted">请运行 npm run xaj:generate 后刷新。</p>
      </div>
    );
  }
  if (!data || !live) {
    return <div className="xaj-loading">加载机理对照台…</div>;
  }

  const metrics = live.metrics;
  const warm = live.warm;
  const holdout = live.holdout;
  const lstmNote =
    data.lstm_note ||
    "Lag-LSTM 为本页示意：滞后特征 + 岭回归（teacher-forcing 计分），不是完整深度学习训练栈。";
  const disclaimer =
    data.disclaimer ||
    "教学对照用合成 forcing / 合成观测，非实测站网业务系统。";
  const protocol = data.protocol;

  return (
    <div className="xaj-app">
      <div className="xaj-disclaimer" role="note">
        <strong>免责声明</strong>
        {disclaimer}
      </div>

      <header className="xaj-hero">
        <div>
          <div className="xaj-kicker">机理 ↔ 数据驱动 · Xinanjiang</div>
          <h1>{data.basin.name}</h1>
          <p className="xaj-sell">
            日降水 → 三水源新安江 → 出口流量；指标口径与 Hydro-ML / HydroInfo
            对齐（NSE / RMSE / KGE，单位 m³/s）。观测为真值+噪声合成——高分须结合协议与留出段解读。
          </p>
          <p className="xaj-bridge-line">
            同流域或同评价指标下的数据驱动对照见{" "}
            <Link href={hydroMlUrl}>Hydro-ML</Link>
            {" · "}
            <Link href={hydroInfoUrl}>HydroInfo</Link>
          </p>
        </div>
        <div className="xaj-hero-actions">
          <button type="button" className="xaj-btn" onClick={exportParamsJson}>
            导出参数 JSON
          </button>
          <button type="button" className="xaj-btn ghost" onClick={exportSeriesCsv}>
            导出过程线 CSV
          </button>
          <span className="xaj-pill">{data.basin.area_km2} km² · daily</span>
          {data.basin.schematic && <span className="xaj-pill warn">合成示意</span>}
        </div>
      </header>

      <p className="xaj-note">{data.basin.note}</p>

      <section className="xaj-panel xaj-protocol">
        <h2>数据生成协议（透明）</h2>
        <p className="xaj-muted">
          易被问「是不是自己生成自己拟合」：此处写清协议。率定参数 ≠ 真值；高 NSE
          保留，但并列留出段与 baseline。
        </p>
        {protocol ? (
          <div className="xaj-protocol-grid">
            <div>
              <h3>观测合成</h3>
              <ul>
                <li>{protocol.obs_generation}</li>
                <li>
                  噪声：{protocol.noise.type}；U∈[
                  {protocol.noise.mult_uniform.join(", ")}]，σ=
                  {protocol.noise.add_gaussian_sigma_m3s} m³/s
                </li>
                <li>
                  种子：forcing={protocol.forcing_seed}，noise={protocol.noise_seed}；N=
                  {protocol.n_days} d
                </li>
                <li>
                  <code>{protocol.noise.formula}</code>
                </li>
              </ul>
            </div>
            <div>
              <h3>指标段划分</h3>
              <ul>
                <li>单位：{protocol.metric_unit}（与图一致）</li>
                <li>暖期：前 {protocol.warmup_days} d 不计分（写死）</li>
                <li>{protocol.metric_periods.post_warmup}</li>
                <li>{protocol.metric_periods.holdout_tail}</li>
                <li>Baseline：{protocol.baselines.join("；")}</li>
              </ul>
            </div>
            <div>
              <h3>真值参数（表）</h3>
              <div className="xaj-truth-table-wrap">
                <table className="xaj-table compact">
                  <tbody>
                    {PARAM_DOCS.map((d) => (
                      <tr key={d.key}>
                        <td>{d.symbol}</td>
                        <td>{truth[d.key]}</td>
                        <td className="dim">{calibrated[d.key]}（率定）</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="xaj-muted">
            请运行 <code>npm run xaj:generate</code> 以写入 protocol 字段。
          </p>
        )}
      </section>

      <div className="xaj-layout">
        <aside className={`xaj-guide ${guideOpen ? "open" : "collapsed"}`}>
          <div className="xaj-panel-head">
            <h2>率定向导</h2>
            <button
              type="button"
              className="xaj-btn ghost"
              onClick={() => setGuideOpen((o) => !o)}
              aria-expanded={guideOpen}
            >
              {guideOpen ? "折叠" : "展开"}
            </button>
          </div>
          {guideOpen && (
            <>
              <p className="xaj-muted">
                {data.calibration.method} · {data.calibration.period}
              </p>
              <p className="xaj-guide-disclaimer">
                手工试错 + 目视过程线 / NSE。此处不宣称已全局最优率定。
              </p>
              <ol className="xaj-guide-steps">
                {GUIDE_STEPS.map((s) => {
                  const on = guideStep === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`xaj-guide-step${on ? " active" : ""}`}
                        onClick={() => selectGuideStep(s.id)}
                        aria-pressed={on}
                      >
                        <span className="xaj-guide-num">Step {s.step}</span>
                        <strong>{s.title}</strong>
                        <span className="xaj-guide-focus">{s.focus}</span>
                        {on && (
                          <span className="xaj-guide-observe">
                            <em>观察什么</em>
                            {s.observe}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="xaj-guide-nav">
                <button
                  type="button"
                  className="xaj-btn ghost"
                  disabled={guideIndex <= 0}
                  onClick={() => stepGuide(-1)}
                >
                  上一步
                </button>
                <span className="xaj-muted">
                  {guideStep ? `${guideIndex + 1} / ${GUIDE_STEPS.length}` : "未选步骤"}
                </span>
                <button
                  type="button"
                  className="xaj-btn"
                  disabled={guideIndex >= GUIDE_STEPS.length - 1 && !!guideStep}
                  onClick={() => stepGuide(1)}
                >
                  下一步
                </button>
              </div>
            </>
          )}
        </aside>

        <div className="xaj-main">
          <section className="xaj-panel">
            <div className="xaj-panel-head">
              <h2>过程线对照</h2>
              <label className="xaj-window">
                窗口
                <select
                  value={windowDays}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                >
                  <option value={90}>90 d</option>
                  <option value={180}>180 d</option>
                  <option value={365}>365 d</option>
                  <option value={730}>全部</option>
                </select>
              </label>
            </div>
            <div className="xaj-legend">
              <span>
                <i style={{ background: "#ffd166" }} /> 观测（合成 = 真值 XAJ + 噪声）
              </span>
              <span className="xaj-warmup-legend">
                <i className="band" /> 暖期（前 {warm} d，不计分）
              </span>
              <span className="xaj-warmup-legend">
                <i className="holdout" /> 末 {holdout} d 留出盲测
              </span>
              {SERIES_META.map((m) => (
                <label key={m.key}>
                  <input
                    type="checkbox"
                    checked={visible[m.key]}
                    onChange={(e) =>
                      setVisible((v) => ({ ...v, [m.key]: e.target.checked }))
                    }
                  />
                  <i style={{ background: m.color }} />
                  {m.label}
                </label>
              ))}
            </div>
            {!paramsOk && (
              <p className="xaj-param-banner" role="status">
                参数非法，已暂停重跑（保留上一有效过程线）。请修正下方标红项。
              </p>
            )}
            <canvas ref={canvasRef} className="xaj-canvas" />
            <p className="xaj-muted xaj-chart-hint">
              建议窗口选「全部」或含序列开头，才能看见暖期半透明带。主图仅对照出口流量，不叠内部过程。
            </p>
          </section>

          <section className="xaj-panel xaj-internals">
            <div className="xaj-panel-head">
              <h2>内部过程（可解释 · 示意）</h2>
              <div className="xaj-param-actions">
                <label className="xaj-toggle">
                  <input
                    type="checkbox"
                    checked={showSources}
                    onChange={(e) => setShowSources(e.target.checked)}
                  />
                  三水源堆叠
                </label>
                <label className="xaj-toggle">
                  <input
                    type="checkbox"
                    checked={showStorage}
                    onChange={(e) => setShowStorage(e.target.checked)}
                  />
                  蓄量过程
                </label>
              </div>
            </div>
            <p className="xaj-muted">
              面试可指着副图讲：产流如何分水源、张力水/自由水如何涨落——不是黑箱对照。与主对照图时间窗同步。
            </p>

            <div className="xaj-balance-card">
              <h3>水量平衡检查</h3>
              <p className="xaj-muted">{live.balance.note}</p>
              <table className="xaj-table">
                <tbody>
                  <tr>
                    <td>ΣP 降水</td>
                    <td>{live.balance.precip_mm.toFixed(1)} mm</td>
                  </tr>
                  <tr>
                    <td>ΣE 蒸发</td>
                    <td>{live.balance.et_mm.toFixed(1)} mm</td>
                  </tr>
                  <tr>
                    <td>ΣQ 出口径流深</td>
                    <td>{live.balance.runoff_mm.toFixed(1)} mm</td>
                  </tr>
                  <tr>
                    <td>ΔS 蓄量变化</td>
                    <td>{live.balance.dS_mm.toFixed(1)} mm</td>
                  </tr>
                  <tr>
                    <td>残差 P−E−Q−ΔS</td>
                    <td className={live.balance.warn ? "warn" : "ok"}>
                      {live.balance.residual_mm.toFixed(2)} mm（
                      {live.balance.residual_pct_of_P.toFixed(2)}% of P）
                      {live.balance.warn ? " · 告警：残差偏大" : " · 闭合可接受"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {(showSources || showStorage) && (
              <div className={`xaj-internal-grid${showSources && showStorage ? "" : " single"}`}>
                {showSources && (
                  <div>
                    <canvas ref={sourcesCanvasRef} className="xaj-canvas xaj-canvas-sm" />
                    <p className="xaj-muted">
                      RS / RI / RG：自由水水库划分的地表、壤中、地下产流分量（mm/d，进汇流前）。
                    </p>
                  </div>
                )}
                {showStorage && (
                  <div>
                    <canvas ref={storageCanvasRef} className="xaj-canvas xaj-canvas-sm" />
                    <p className="xaj-muted">
                      WU/WL/WD 分层张力水与 S 自由水蓄量（mm）；初值见 README（容量比例假定）。
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="xaj-grid">
            <div className="xaj-panel">
              <h2>指标口径（单位 m³/s）</h2>
              <p className="xaj-eval-policy">
                暖期策略写死：丢弃前 <strong>{warm} d</strong> 再计分；另报序列末{" "}
                <strong>{holdout} d</strong> 留出盲测。NSE / RMSE / KGE 与图上序列一致。
              </p>
              <h3 className="xaj-subh">暖期后全段</h3>
              <table className="xaj-table">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>NSE</th>
                    <th>RMSE</th>
                    <th>KGE</th>
                  </tr>
                </thead>
                <tbody>
                  {SERIES_META.map((m) => {
                    const s = metrics[m.key].postWarmup;
                    return (
                      <tr key={m.key}>
                        <td>
                          {m.label}
                          {m.baseline ? (
                            <span className="xaj-tag-base">baseline</span>
                          ) : null}
                        </td>
                        <td className={!paramsOk && m.key === "xaj" ? "dim" : undefined}>
                          {formatMetric(s.NSE)}
                          {!paramsOk && m.key === "xaj" ? " *" : ""}
                        </td>
                        <td className={!paramsOk && m.key === "xaj" ? "dim" : undefined}>
                          {formatRmse(s.RMSE)}
                        </td>
                        <td className={!paramsOk && m.key === "xaj" ? "dim" : undefined}>
                          {formatKge(s.KGE)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <h3 className="xaj-subh">末 {holdout} d 留出盲测</h3>
              <table className="xaj-table">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>NSE</th>
                    <th>RMSE</th>
                    <th>KGE</th>
                  </tr>
                </thead>
                <tbody>
                  {SERIES_META.map((m) => {
                    const s = metrics[m.key].holdout;
                    return (
                      <tr key={`h-${m.key}`}>
                        <td>{m.label}</td>
                        <td>{formatMetric(s.NSE)}</td>
                        <td>{formatRmse(s.RMSE)}</td>
                        <td>{formatKge(s.KGE)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="xaj-muted">{lstmNote}</p>
            </div>

            <div className="xaj-panel">
              <h2>敏感性（heuristic / demo）</h2>
              <p className="xaj-muted">
                在当前编辑参数上，对单个参数做 ±10% 扰动，对比暖期后 NSE。仅作局部敏感示意，不是自动寻优。
              </p>
              <label className="xaj-window xaj-sens-pick">
                参数
                <select
                  value={sensKey}
                  onChange={(e) => setSensKey(e.target.value as keyof XajParams)}
                >
                  {SENSITIVITY_KEYS.map((k) => {
                    const d = PARAM_DOCS.find((x) => x.key === k)!;
                    return (
                      <option key={k} value={k}>
                        {d.symbol} · {d.zh}
                      </option>
                    );
                  })}
                </select>
              </label>
              {sensitivity ? (
                <table className="xaj-table">
                  <thead>
                    <tr>
                      <th>扰动</th>
                      <th>取值</th>
                      <th>NSE</th>
                      <th>ΔNSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>−10%</td>
                      <td>{sensitivity.down.skipped ? "越界跳过" : sensitivity.down.value}</td>
                      <td>{formatMetric(sensitivity.down.nse)}</td>
                      <td>
                        {sensitivity.down.skipped
                          ? "—"
                          : formatDelta(sensitivity.down.nse - sensitivity.baseNse)}
                      </td>
                    </tr>
                    <tr>
                      <td>当前</td>
                      <td>{sensitivity.base}</td>
                      <td>{formatMetric(sensitivity.baseNse)}</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>+10%</td>
                      <td>{sensitivity.up.skipped ? "越界跳过" : sensitivity.up.value}</td>
                      <td>{formatMetric(sensitivity.up.nse)}</td>
                      <td>
                        {sensitivity.up.skipped
                          ? "—"
                          : formatDelta(sensitivity.up.nse - sensitivity.baseNse)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="xaj-param-banner">参数非法时不计算敏感性。</p>
              )}
            </div>
          </section>

          <section className="xaj-panel xaj-params-panel" ref={paramsPanelRef}>
            <div className="xaj-panel-head">
              <h2>新安江参数（三水源 · 即时重跑）</h2>
              <div className="xaj-param-actions">
                <button
                  type="button"
                  className="xaj-btn"
                  onClick={() => applyParams(calibrated)}
                >
                  恢复率定值
                </button>
                <button
                  type="button"
                  className="xaj-btn ghost"
                  onClick={() => applyParams(truth)}
                  title="合成观测由真值参数 + 噪声生成"
                >
                  恢复真值参数
                </button>
              </div>
            </div>

            <div className="xaj-source-row" aria-live="polite">
              <span
                className={`xaj-source ${paramSource === "truth" ? "on" : ""}`}
                title="生成合成观测用的「上帝」参数"
              >
                真值
              </span>
              <span
                className={`xaj-source ${paramSource === "calibrated" ? "on" : ""}`}
                title="手工率定后的对照参数集（非全局最优）"
              >
                率定值
              </span>
              <span
                className={`xaj-source ${paramSource === "editing" ? "on edit" : ""}`}
              >
                当前编辑
              </span>
              <span className="xaj-source-hint">
                {paramSource === "truth" && "正在使用真值参数跑 XAJ"}
                {paramSource === "calibrated" && "正在使用手工率定参数（默认）"}
                {paramSource === "editing" && "已偏离真值 / 率定值，改参即时重算"}
              </span>
            </div>

            {activeGuide && (
              <p className="xaj-guide-banner">
                Step {activeGuide.step} · {activeGuide.title}：高亮 {activeGuide.focus}
                。{activeGuide.observe}
              </p>
            )}

            {paramErrors.length > 0 && (
              <ul className="xaj-param-errors">
                {paramErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}

            <div className="xaj-param-groups">
              {PARAM_GROUPS.map((g) => {
                const groupKeys = PARAM_DOCS.filter((d) => d.group === g.id).map(
                  (d) => d.key
                );
                const groupHot =
                  highlightKeys.size > 0 &&
                  groupKeys.some((k) => highlightKeys.has(k));
                return (
                  <fieldset
                    key={g.id}
                    className={`xaj-param-group${groupHot ? " guide-hot" : ""}${
                      highlightKeys.size > 0 && !groupHot ? " guide-dim" : ""
                    }`}
                  >
                    <legend>
                      {g.title}
                      <em>{g.hint}</em>
                    </legend>
                    <div className="xaj-params">
                      {PARAM_DOCS.filter((d) => d.group === g.id).map((d) => {
                        const bad = Boolean(fieldErrors[d.key]);
                        const hot = highlightKeys.has(d.key);
                        return (
                          <label
                            key={d.key}
                            className={`xaj-param${bad ? " invalid" : ""}${
                              hot ? " highlight" : ""
                            }${highlightKeys.size > 0 && !hot ? " dimmed" : ""}`}
                          >
                            <span className="xaj-param-label">
                              <strong>{d.symbol}</strong>
                              {d.zh}
                              <em>{d.unit}</em>
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              spellCheck={false}
                              value={drafts[d.key]}
                              aria-invalid={bad}
                              aria-describedby={`xaj-${d.key}-hint`}
                              onChange={(e) => onDraftChange(d.key, e.target.value)}
                            />
                            <small id={`xaj-${d.key}-hint`}>
                              {fieldErrors[d.key] ??
                                `${d.meaning} · 范围 [${d.min}, ${d.max}]`}
                            </small>
                            <span className="xaj-param-ref">
                              真值 {truth[d.key]} · 率定 {calibrated[d.key]}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <footer className="xaj-foot">
        诚实边界：观测为合成序列；Lag-LSTM 为滞后岭回归示意，非完整深度学习项目；率定值为手工试错。
        内部过程可导出，水量平衡可检查闭合——不是黑箱对照。机理台 <code>/xaj-bench</code>。
      </footer>
    </div>
  );
}
