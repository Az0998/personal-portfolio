"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StationCard = {
  id: string;
  name: string;
  role: string;
  lat: number;
  lon: number;
  q: number;
  stage: number;
  delta: number;
  status: "normal" | "warn" | "alert";
  warn_q: number;
  alert_q: number;
};

type Meta = {
  basin: string;
  note: string;
  as_of: string;
  stations: Array<{
    id: string;
    name: string;
    role: string;
    river: string;
    lat: number;
    lon: number;
    warn_q: number;
    alert_q: number;
  }>;
};

type SeriesBundle = {
  dates: string[];
  stations: Record<
    string,
    {
      q: (number | null)[];
      stage: (number | null)[];
      precip: (number | null)[] | null;
      temp: (number | null)[] | null;
      warn_q: number;
      alert_q: number;
    }
  >;
};

type ModelsBundle = {
  note: string;
  metrics: Record<string, Record<string, { NSE?: number; KGE?: number; RMSE?: number }>>;
  series: {
    dates: string[];
    observed: (number | null)[];
    persistence: number[];
    xgboost: number[];
    lstm_attention: number[];
  };
};

type FloodBundle = {
  threshold_cfs: number;
  threshold_note: string;
  csi: Array<{
    horizon: number;
    attn_CSI?: number;
    xgb_CSI?: number;
    pers_CSI?: number;
    attn_POD?: number;
    attn_FAR?: number;
  }>;
  events: Array<{
    start: string;
    end: string;
    peak_q: number;
    peak_stage: number;
    days: number;
    start_idx: number;
    end_idx: number;
  }>;
};

type ElementsBundle = {
  elements: Array<{ id: string; label: string; unit: string; group: string }>;
  defaults: string[];
};

declare global {
  interface Window {
    echarts?: any;
    L?: any;
  }
}

const STATUS = {
  normal: { label: "正常", cls: "ok" },
  warn: { label: "注意", cls: "warn" },
  alert: { label: "警戒", cls: "alert" },
} as const;

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.body.appendChild(s);
  });
}

function loadCss(href: string, id: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url);
  return res.json();
}

export function HydroDashboard() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [overview, setOverview] = useState<{ as_of: string; stations: StationCard[] } | null>(null);
  const [series, setSeries] = useState<SeriesBundle | null>(null);
  const [models, setModels] = useState<ModelsBundle | null>(null);
  const [flood, setFlood] = useState<FloodBundle | null>(null);
  const [elements, setElements] = useState<ElementsBundle | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [active, setActive] = useState<string[]>(["q", "precip", "lstm_attention"]);
  const [eventIdx, setEventIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const forecastRef = useRef<HTMLDivElement>(null);
  const csiChartRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const chartInst = useRef<any>(null);
  const forecastInst = useRef<any>(null);
  const csiInst = useRef<any>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet-css");
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js", "echarts-js"),
          loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet-js"),
        ]);
        const [m, o, s, md, f, el, fb] = await Promise.all([
          getJSON<Meta>("/hydro/meta.json"),
          getJSON<{ as_of: string; stations: StationCard[] }>("/hydro/overview.json"),
          getJSON<SeriesBundle>("/hydro/series.json"),
          getJSON<ModelsBundle>("/hydro/models.json"),
          getJSON<FloodBundle>("/hydro/flood.json"),
          getJSON<ElementsBundle>("/hydro/elements.json"),
          getJSON("/hydro/forecast_baseline.json"),
        ]);
        if (cancelled) return;
        setMeta(m);
        setOverview(o);
        setSeries(s);
        setModels(md);
        setFlood(f);
        setElements(el);
        setForecast(fb);
        setActive(el.defaults || ["q", "precip", "lstm_attention"]);
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const controlId = useMemo(
    () => meta?.stations.find((s) => s.role === "control")?.id || "TAO-CTRL",
    [meta]
  );

  const toggle = (id: string) => {
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const renderMainChart = useCallback(() => {
    if (!window.echarts || !chartRef.current || !series || !models || !flood) return;
    if (!chartInst.current) chartInst.current = window.echarts.init(chartRef.current);

    const ctrl = series.stations[controlId];
    const up1 = series.stations["TAO-UP1"];
    const up2 = series.stations["TAO-UP2"];
    const dates = series.dates;
    const ev = flood.events[eventIdx];

    const seriesOpt: any[] = [];
    const pushLine = (name: string, data: (number | null)[] | number[], color: string, yAxisIndex = 0) => {
      seriesOpt.push({
        name,
        type: "line",
        showSymbol: false,
        data,
        yAxisIndex,
        lineStyle: { width: 1.8, color },
        itemStyle: { color },
      });
    };

    if (active.includes("q") && ctrl) pushLine("流量 Q", ctrl.q, "#2ec4b6");
    if (active.includes("stage") && ctrl) pushLine("水位 Z", ctrl.stage, "#a8e4f5");
    if (active.includes("precip") && ctrl?.precip) {
      seriesOpt.push({
        name: "降水 P",
        type: "bar",
        yAxisIndex: 1,
        data: ctrl.precip,
        itemStyle: { color: "rgba(61,139,253,0.45)" },
      });
    }
    if (active.includes("temp") && ctrl?.temp) pushLine("气温 T", ctrl.temp, "#e9a825", 1);
    if (active.includes("upstream_up1") && up1) pushLine("渭源上游", up1.q, "#7dd3c0");
    if (active.includes("upstream_up2") && up2) pushLine("康乐支流", up2.q, "#5b8def");
    if (active.includes("persistence")) pushLine("Persistence", models.series.persistence, "#9a84b5");
    if (active.includes("xgboost")) pushLine("XGBoost", models.series.xgboost, "#ff8fb8");
    if (active.includes("lstm_attention"))
      pushLine("LSTM-Attention", models.series.lstm_attention, "#3d8bfd");

    const markArea =
      ev != null
        ? {
            itemStyle: { color: "rgba(228,87,46,0.12)" },
            data: [[{ xAxis: ev.start }, { xAxis: ev.end }]],
          }
        : undefined;

    if (seriesOpt[0]) {
      seriesOpt[0].markArea = markArea;
      seriesOpt[0].markLine = {
        symbol: "none",
        data: [
          { yAxis: ctrl?.warn_q, name: "注意", lineStyle: { color: "#e9a825", type: "dashed" } },
          { yAxis: ctrl?.alert_q, name: "警戒", lineStyle: { color: "#e4572e", type: "dashed" } },
          {
            yAxis: flood.threshold_cfs,
            name: "P90",
            lineStyle: { color: "#ff8fb8", type: "dotted" },
          },
        ],
        label: { color: "#8fb3c0", fontSize: 10 },
      };
    }

    chartInst.current.setOption(
      {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        legend: { textStyle: { color: "#8fb3c0", fontSize: 11 }, top: 0, type: "scroll" },
        grid: { left: 52, right: 42, top: 42, bottom: 36 },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: { color: "#8fb3c0", fontSize: 10 },
          axisLine: { lineStyle: { color: "rgba(120,190,210,0.25)" } },
        },
        yAxis: [
          {
            type: "value",
            name: "cfs / ft",
            nameTextStyle: { color: "#8fb3c0" },
            axisLabel: { color: "#8fb3c0" },
            splitLine: { lineStyle: { color: "rgba(120,190,210,0.08)" } },
          },
          {
            type: "value",
            name: "mm / °C",
            nameTextStyle: { color: "#8fb3c0" },
            axisLabel: { color: "#8fb3c0" },
            splitLine: { show: false },
          },
        ],
        dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 4 }],
        series: seriesOpt,
      },
      { notMerge: true }
    );
  }, [active, controlId, eventIdx, flood, models, series]);

  const renderForecast = useCallback(() => {
    if (!window.echarts || !forecastRef.current || !forecast) return;
    if (!forecastInst.current) forecastInst.current = window.echarts.init(forecastRef.current);
    forecastInst.current.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      grid: { left: 48, right: 16, top: 28, bottom: 32 },
      xAxis: {
        type: "category",
        data: forecast.path.map((p: any) => p.date),
        axisLabel: { color: "#8fb3c0" },
      },
      yAxis: {
        type: "value",
        name: "cfs",
        axisLabel: { color: "#8fb3c0" },
        splitLine: { lineStyle: { color: "rgba(120,190,210,0.08)" } },
      },
      series: [
        {
          type: "line",
          smooth: true,
          data: forecast.path.map((p: any) => p.q),
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(61,139,253,0.3)" },
                { offset: 1, color: "rgba(61,139,253,0.02)" },
              ],
            },
          },
          lineStyle: { width: 2.4, color: "#3d8bfd" },
          itemStyle: { color: "#3d8bfd" },
        },
      ],
    });
  }, [forecast]);

  const renderCsi = useCallback(() => {
    if (!window.echarts || !csiChartRef.current || !flood) return;
    if (!csiInst.current) csiInst.current = window.echarts.init(csiChartRef.current);
    const hs = flood.csi.map((c) => `${c.horizon}日`);
    csiInst.current.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      legend: { textStyle: { color: "#8fb3c0" }, top: 0 },
      grid: { left: 40, right: 12, top: 36, bottom: 28 },
      xAxis: { type: "category", data: hs, axisLabel: { color: "#8fb3c0" } },
      yAxis: {
        type: "value",
        max: 1,
        name: "CSI",
        axisLabel: { color: "#8fb3c0" },
        splitLine: { lineStyle: { color: "rgba(120,190,210,0.08)" } },
      },
      series: [
        {
          name: "LSTM-Attn",
          type: "bar",
          data: flood.csi.map((c) => Number(c.attn_CSI?.toFixed?.(3) ?? c.attn_CSI ?? 0)),
          itemStyle: { color: "#3d8bfd" },
        },
        {
          name: "XGBoost",
          type: "bar",
          data: flood.csi.map((c) => Number(c.xgb_CSI?.toFixed?.(3) ?? c.xgb_CSI ?? 0)),
          itemStyle: { color: "#ff8fb8" },
        },
        {
          name: "Persistence",
          type: "bar",
          data: flood.csi.map((c) => Number(c.pers_CSI?.toFixed?.(3) ?? c.pers_CSI ?? 0)),
          itemStyle: { color: "#9a84b5" },
        },
      ],
    });
  }, [flood]);

  const renderMap = useCallback(() => {
    if (!window.L || !mapRef.current || !overview) return;
    if (mapInst.current) {
      mapInst.current.remove();
      mapInst.current = null;
    }
    const map = window.L.map(mapRef.current, { zoomControl: true }).setView([35.35, 103.9], 9);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 16,
    }).addTo(map);

    overview.stations.forEach((st) => {
      const color = st.status === "alert" ? "#e4572e" : st.status === "warn" ? "#e9a825" : "#2ec4b6";
      const marker = window.L.circleMarker([st.lat, st.lon], {
        radius: st.role === "control" ? 10 : 7,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map);
      marker.bindPopup(
        `<strong>${st.name}</strong><br/>Q ${st.q} cfs<br/>Z ${st.stage} ft<br/>状态 ${STATUS[st.status].label}`
      );
    });
    mapInst.current = map;
    setTimeout(() => map.invalidateSize(), 80);
  }, [overview]);

  useEffect(() => {
    if (!ready) return;
    renderMainChart();
    renderForecast();
    renderCsi();
    renderMap();
    const onResize = () => {
      chartInst.current?.resize();
      forecastInst.current?.resize();
      csiInst.current?.resize();
      mapInst.current?.invalidateSize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready, renderMainChart, renderForecast, renderCsi, renderMap]);

  useEffect(() => {
    if (!playing || !flood?.events?.length) return;
    const t = setInterval(() => {
      setEventIdx((i) => (i + 1) % flood.events.length);
    }, 2200);
    return () => clearInterval(t);
  }, [playing, flood]);

  const m1 = models?.metrics?.["1"]?.["LSTM-Attention"];
  const m3 = models?.metrics?.["3"]?.["LSTM"];
  const m7 = models?.metrics?.["7"]?.["LSTM-Attention"];

  if (error) {
    return <main className="hydro-main"><div className="hydro-panel">加载失败：{error}</div></main>;
  }
  if (!ready || !overview || !meta || !elements || !flood) {
    return <main className="hydro-main"><div className="hydro-panel">正在装载水情数据包…</div></main>;
  }

  const ev = flood.events[eventIdx];

  return (
    <main className="hydro-main">
      <div className="hydro-note">
        {meta.basin} · 数据截止 {meta.as_of} · {meta.note}
      </div>

      <section className="hydro-kpi">
        {overview.stations.map((s) => {
          const st = STATUS[s.status];
          return (
            <div className="hydro-card" key={s.id}>
              <div className="label">
                {s.name} · {s.id}
              </div>
              <div className="value">
                {s.q.toLocaleString()} <small style={{ fontSize: 13, color: "var(--h-muted)" }}>cfs</small>
              </div>
              <div className="meta">
                <span>
                  水位 {s.stage} ft · Δ {s.delta > 0 ? "+" : ""}
                  {s.delta}
                </span>
                <span className={`hydro-badge ${st.cls}`}>{st.label}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="hydro-grid-3">
        <article className="hydro-panel">
          <h2>Leaflet 国内示范站网</h2>
          <p className="desc">洮河坐标布局 · 点击站点查看瞬时水情</p>
          <div ref={mapRef} className="hydro-map" />
        </article>

        <article className="hydro-panel">
          <h2>可变要素出图</h2>
          <p className="desc">勾选观测 / 气象 / 站网 / 模型曲线，支持缩放与洪水窗高亮</p>
          <div className="hydro-controls">
            {elements.elements.map((el) => (
              <button
                key={el.id}
                type="button"
                className={`hydro-chip ${active.includes(el.id) ? "on" : ""}`}
                onClick={() => toggle(el.id)}
              >
                {el.label}
              </button>
            ))}
          </div>
          <div ref={chartRef} className="hydro-chart" />
        </article>

        <article className="hydro-panel">
          <h2>洪水 CSI 回放</h2>
          <p className="desc">
            {flood.threshold_note} · 阈值 {Math.round(flood.threshold_cfs).toLocaleString()} cfs
          </p>
          <div className="hydro-controls">
            <button type="button" className={`hydro-chip ${playing ? "on" : ""}`} onClick={() => setPlaying((p) => !p)}>
              {playing ? "暂停回放" : "自动回放"}
            </button>
            <button
              type="button"
              className="hydro-chip"
              onClick={() => setEventIdx((i) => (i - 1 + flood.events.length) % flood.events.length)}
            >
              上一起
            </button>
            <button
              type="button"
              className="hydro-chip"
              onClick={() => setEventIdx((i) => (i + 1) % flood.events.length)}
            >
              下一起
            </button>
          </div>
          <div className="hydro-flood-list">
            {flood.events.map((e, i) => (
              <button
                key={`${e.start}-${e.end}`}
                type="button"
                className={`hydro-flood-item ${i === eventIdx ? "active" : ""}`}
                onClick={() => {
                  setPlaying(false);
                  setEventIdx(i);
                }}
              >
                <div className="row">
                  <strong>
                    #{i + 1} {e.start} → {e.end}
                  </strong>
                  <span>{e.peak_q.toLocaleString()} cfs</span>
                </div>
                <div className="sub">
                  持续 {e.days} 日 · 峰水位 {e.peak_stage} ft
                </div>
              </button>
            ))}
          </div>
          {ev && (
            <div className="hydro-metrics" style={{ marginTop: 10 }}>
              <div className="pill">
                当前事件峰洪 <strong>{ev.peak_q.toLocaleString()}</strong> cfs
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="hydro-grid-2">
        <article className="hydro-panel">
          <h2>LSTM 推理对接（指标舱 + 展示序列）</h2>
          <p className="desc">{models?.note}</p>
          <div className="hydro-metrics">
            <div className="pill">
              1 日 LSTM-Attn NSE <strong>{m1?.NSE?.toFixed(3) ?? "—"}</strong>
            </div>
            <div className="pill">
              3 日 LSTM NSE <strong>{m3?.NSE?.toFixed(3) ?? "—"}</strong>
            </div>
            <div className="pill">
              7 日 LSTM-Attn NSE <strong>{m7?.NSE?.toFixed(3) ?? "—"}</strong>
            </div>
            <div className="pill">
              1 日 KGE <strong>{m1?.KGE?.toFixed(3) ?? "—"}</strong>
            </div>
          </div>
          <div ref={csiChartRef} className="hydro-chart" style={{ height: 260 }} />
          <table className="hydro-csi-table">
            <thead>
              <tr>
                <th>预见期</th>
                <th>Attn CSI</th>
                <th>XGB CSI</th>
                <th>Pers CSI</th>
                <th>POD</th>
                <th>FAR</th>
              </tr>
            </thead>
            <tbody>
              {flood.csi.map((c) => (
                <tr key={c.horizon}>
                  <td>{c.horizon} 日</td>
                  <td>{c.attn_CSI?.toFixed(3) ?? "—"}</td>
                  <td>{c.xgb_CSI?.toFixed(3) ?? "—"}</td>
                  <td>{c.pers_CSI?.toFixed(3) ?? "—"}</td>
                  <td>{c.attn_POD?.toFixed(3) ?? "—"}</td>
                  <td>{c.attn_FAR?.toFixed(3) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="hydro-panel">
          <h2>7 日业务基线预报</h2>
          <p className="desc">Persistence→MA7 混合；与论文 LSTM 分工：业务基线 vs 深度学习实验</p>
          <div ref={forecastRef} className="hydro-chart" />
          <div className="hydro-metrics">
            <div className="pill">
              起报 <strong>{forecast?.as_of}</strong>
            </div>
            <div className="pill">
              最新流量 <strong>{forecast?.latest_q?.toLocaleString?.()}</strong> cfs
            </div>
            <div className="pill">
              方法 <strong>{forecast?.method}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
