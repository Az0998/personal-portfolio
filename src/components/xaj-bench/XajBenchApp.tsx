"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CALIBRATED_XAJ,
  DEFAULT_XAJ,
  PARAM_DOCS,
  type XajParams,
  fitLagModel,
  nse,
  persistenceForecast,
  rmse,
  runXaj,
} from "@/lib/xaj/model";

type BenchPayload = {
  basin: {
    name: string;
    area_km2: number;
    schematic: boolean;
    note: string;
  };
  calibration: { method: string; period: string; notes: string[] };
  params_calibrated: XajParams;
  warmup_days: number;
  metrics: Record<string, { NSE: number; RMSE: number }>;
  lstm_note: string;
  series: {
    date: string[];
    precip_mm: number[];
    em_mm: number[];
    q_obs: number[];
    q_xaj: number[];
    q_persistence: number[];
    q_lag_lstm: number[];
  };
};

type SeriesKey = "xaj" | "persistence" | "lag_lstm";

const SERIES_META: { key: SeriesKey; label: string; color: string }[] = [
  { key: "xaj", label: "新安江（三水源）", color: "#2ec4b6" },
  { key: "lag_lstm", label: "Lag-LSTM（示意）", color: "#5b8def" },
  { key: "persistence", label: "Persistence", color: "#8899aa" },
];

function drawChart(
  canvas: HTMLCanvasElement,
  opts: {
    precip: number[];
    obs: number[];
    series: { values: number[]; color: string; visible: boolean }[];
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

  const { start, end, precip, obs, series } = opts;
  const n = end - start;
  if (n < 2) return;
  const pad = { l: 48, r: 16, t: 16, b: 36 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const qMax = Math.max(
    1,
    ...obs.slice(start, end),
    ...series.flatMap((s) => (s.visible ? s.values.slice(start, end) : [0]))
  );
  const pMax = Math.max(1, ...precip.slice(start, end));

  // precip bars (top)
  const barH = plotH * 0.22;
  ctx.fillStyle = "rgba(91, 141, 239, 0.35)";
  for (let i = 0; i < n; i++) {
    const x = pad.l + (i / (n - 1)) * plotW;
    const ph = (precip[start + i] / pMax) * barH;
    ctx.fillRect(x - 1, pad.t + barH - ph, 2, ph);
  }

  const y0 = pad.t + barH + 8;
  const qH = plotH - barH - 8;
  const yAt = (q: number) => y0 + (1 - q / qMax) * qH;
  const xAt = (i: number) => pad.l + (i / (n - 1)) * plotW;

  // grid
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
    for (let i = 0; i < n; i++) {
      const x = xAt(i);
      const y = yAt(vals[start + i] ?? 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
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

export function XajBenchApp() {
  const [data, setData] = useState<BenchPayload | null>(null);
  const [error, setError] = useState("");
  const [params, setParams] = useState<XajParams>(CALIBRATED_XAJ);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    xaj: true,
    persistence: true,
    lag_lstm: true,
  });
  const [windowDays, setWindowDays] = useState(180);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/xaj-bench/benchmark.json");
        if (!res.ok) throw new Error("无法加载 benchmark.json");
        const json = (await res.json()) as BenchPayload;
        if (cancelled) return;
        setData(json);
        setParams({ ...DEFAULT_XAJ, ...json.params_calibrated });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo(() => {
    if (!data) return null;
    const { precip_mm, em_mm, q_obs } = data.series;
    const q_xaj = runXaj(params, precip_mm, em_mm);
    const q_persistence = persistenceForecast(q_obs);
    const { predictTeacher } = fitLagModel(precip_mm, q_obs, 7);
    const q_lag_lstm = predictTeacher(precip_mm, q_obs);
    const warm = data.warmup_days;
    const slice = <T,>(a: T[]) => a.slice(warm);
    return {
      q_xaj,
      q_persistence,
      q_lag_lstm,
      metrics: {
        xaj: {
          NSE: nse(slice(q_obs), slice(q_xaj)),
          RMSE: rmse(slice(q_obs), slice(q_xaj)),
        },
        persistence: {
          NSE: nse(slice(q_obs), slice(q_persistence)),
          RMSE: rmse(slice(q_obs), slice(q_persistence)),
        },
        lag_lstm: {
          NSE: nse(slice(q_obs), slice(q_lag_lstm)),
          RMSE: rmse(slice(q_obs), slice(q_lag_lstm)),
        },
      },
    };
  }, [data, params]);

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
      series: SERIES_META.map((m) => ({
        values:
          m.key === "xaj"
            ? live.q_xaj
            : m.key === "persistence"
              ? live.q_persistence
              : live.q_lag_lstm,
        color: m.color,
        visible: visible[m.key],
      })),
    });
  }, [data, live, range, visible]);

  const setParam = useCallback((key: keyof XajParams, value: number) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  const resetParams = () => {
    if (data) setParams({ ...DEFAULT_XAJ, ...data.params_calibrated });
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

  return (
    <div className="xaj-app">
      <header className="xaj-hero">
        <div>
          <div className="xaj-kicker">机理预报对照 · Xinanjiang</div>
          <h1>{data.basin.name}</h1>
          <p className="xaj-sell">
            不是只会刷深度学习，会讲产汇流：日降水 → 新安江三水源 → 出口流量，并与 Persistence /
            Lag-LSTM 同数据对照 NSE。
          </p>
        </div>
        <div className="xaj-hero-actions">
          <Link href="/hydrobench" className="xaj-pill">
            智慧水利
          </Link>
          <span className="xaj-pill">{data.basin.area_km2} km² · daily</span>
          {data.basin.schematic && <span className="xaj-pill warn">schematic</span>}
        </div>
      </header>

      <p className="xaj-note">{data.basin.note}</p>

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
            <i style={{ background: "#ffd166" }} /> 观测（合成）
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
        <canvas ref={canvasRef} className="xaj-canvas" />
      </section>

      <section className="xaj-grid">
        <div className="xaj-panel">
          <h2>指标（暖期后）</h2>
          <table className="xaj-table">
            <thead>
              <tr>
                <th>模型</th>
                <th>NSE</th>
                <th>RMSE</th>
              </tr>
            </thead>
            <tbody>
              {SERIES_META.map((m) => (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  <td>{live.metrics[m.key].NSE.toFixed(3)}</td>
                  <td>{live.metrics[m.key].RMSE.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="xaj-muted">{data.lstm_note}</p>
        </div>

        <div className="xaj-panel">
          <h2>率定思路</h2>
          <p className="xaj-muted">{data.calibration.method}</p>
          <p className="xaj-muted">时段：{data.calibration.period}</p>
          <ol className="xaj-ol">
            {data.calibration.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="xaj-panel">
        <div className="xaj-panel-head">
          <h2>新安江参数（可调，即时重跑）</h2>
          <button type="button" className="xaj-btn" onClick={resetParams}>
            恢复率定值
          </button>
        </div>
        <div className="xaj-params">
          {PARAM_DOCS.filter((d) => d.key !== "area_km2").map((d) => (
            <label key={d.key} className="xaj-param" title={d.meaning}>
              <span>
                {d.zh}
                <em>{d.unit}</em>
              </span>
              <input
                type="number"
                step={d.key === "L" ? 1 : 0.01}
                value={params[d.key]}
                onChange={(e) => setParam(d.key, Number(e.target.value))}
              />
              <small>{d.meaning}</small>
            </label>
          ))}
        </div>
      </section>

      <footer className="xaj-foot">
        机理对照台挂在 <code>/xaj-bench</code>；与 HydroInfo 水情看板、Hydro-ML
        论文实验同属「智慧水利」叙事：先讲产汇流，再谈序列模型。
        HEC-HMS 级结果可替换 <code>public/xaj-bench/benchmark.json</code> 中的序列即可可视化。
      </footer>
    </div>
  );
}
