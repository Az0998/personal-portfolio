"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveHydroStationId } from "@/lib/hydro-station-map";

type StationCard = {
  id: string;
  name: string;
  river: string;
  basin: string;
  role: string;
  lat: number;
  lon: number;
  q: number;
  stage: number;
  precip: number;
  temp: number;
  sediment: number;
  area: number;
  delta: number;
  status: "normal" | "warn" | "alert";
  warn_q: number;
  alert_q: number;
  warn_stage: number;
  alert_stage: number;
};

type Meta = {
  basin: string;
  note: string;
  as_of: string;
  csv?: string;
  units?: Record<string, string>;
  stations: Array<{
    id: string;
    name: string;
    river: string;
    basin: string;
    role: string;
    lat: number;
    lon: number;
  }>;
};

type SeriesBundle = {
  dates: string[];
  stations: Record<
    string,
    {
      q: number[];
      stage: number[];
      precip: number[];
      temp: number[];
      sediment: number[];
      area: number[];
      warn_q: number;
      alert_q: number;
      warn_stage: number;
      alert_stage: number;
    }
  >;
};

type ModelsBundle = {
  note: string;
  station_id?: string;
  metrics: Record<string, Record<string, { NSE?: number; KGE?: number }>>;
  series: {
    dates: string[];
    observed: number[];
    persistence: number[];
    xgboost: number[];
    lstm_attention: number[];
  };
};

type FloodBundle = {
  threshold_m3s: number;
  threshold_note: string;
  station_id?: string;
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
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(src)));
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => {
      (s as any).dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(src));
    document.body.appendChild(s);
  });
}

async function ensureLib(check: () => boolean, loaders: Array<() => Promise<void>>) {
  if (check()) return;
  let lastErr: unknown;
  for (const load of loaders) {
    try {
      await load();
      const start = Date.now();
      while (!check() && Date.now() - start < 4000) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (check()) return;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!check()) throw lastErr || new Error("library load failed");
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

/** 黄河干流示意折线（WGS84，便于无底图时仍能看懂站网） */
const YELLOW_RIVER_PATH: [number, number][] = [
  [36.061, 103.834], // 兰州
  [37.884, 105.992], // 青铜峡
  [39.247, 106.769], // 石嘴山
  [40.265, 111.074], // 头道拐
  [34.612, 110.286], // 潼关
  [34.906, 113.671], // 花园口
  [37.492, 118.312], // 利津
];

const TAO_RIVER_PATH: [number, number][] = [
  [35.137, 104.211], // 渭源
  [35.394, 103.862], // 临洮
  [36.061, 103.834], // 汇入黄河（兰州一带示意）
];

function addChinaBasemap(L: any, map: any) {
  // 默认用「看得清」的浅色中文底图；深色 GeoQ 在不少网络下几乎全黑
  const gaode = L.tileLayer(
    "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
    { subdomains: "1234", maxZoom: 18, attribution: "© 高德", className: "hydro-tiles" }
  );
  const gaodeSat = L.layerGroup([
    L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", {
      subdomains: "1234",
      maxZoom: 18,
      attribution: "© 高德影像",
    }),
    L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}", {
      subdomains: "1234",
      maxZoom: 18,
      opacity: 0.9,
    }),
  ]);
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });
  // Esri Light Gray — zero-key fallback (avoid Carto "API KEY REQUIRED" watermark)
  const esriGray = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 16,
      attribution: "© Esri",
    }
  );

  gaode.addTo(map);
  L.control
    .layers(
      {
        高德标准: gaode,
        高德卫星: gaodeSat,
        "OSM 国际": osm,
        "Esri 浅灰": esriGray,
      },
      {},
      { position: "topright", collapsed: true }
    )
    .addTo(map);

  // 高德首屏若大量 tileerror，自动切到 OSM（零密钥）
  let errors = 0;
  let switched = false;
  gaode.on("tileerror", () => {
    errors += 1;
    if (!switched && errors >= 4) {
      switched = true;
      map.removeLayer(gaode);
      osm.addTo(map);
    }
  });
}

export function HydroDashboard() {
  const searchParams = useSearchParams();
  const stationFromUrl = searchParams.get("station");
  const [ready, setReady] = useState(false);
  const [libsReady, setLibsReady] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [overview, setOverview] = useState<{ as_of: string; stations: StationCard[] } | null>(null);
  const [series, setSeries] = useState<SeriesBundle | null>(null);
  const [models, setModels] = useState<ModelsBundle | null>(null);
  const [flood, setFlood] = useState<FloodBundle | null>(null);
  const [elements, setElements] = useState<ElementsBundle | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [active, setActive] = useState<string[]>(["q", "stage", "precip", "lstm_attention"]);
  const [stationId, setStationId] = useState("YR-HYK");
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
        setActive(el.defaults || ["q", "stage", "precip"]);
        const ids = o.stations.map((x) => x.id);
        setStationId(
          stationFromUrl
            ? resolveHydroStationId(stationFromUrl, ids)
            : ids.includes("YR-HYK")
              ? "YR-HYK"
              : ids[0] || "YR-HYK",
        );
        setReady(true);

        try {
          loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet-css");
          await Promise.all([
            ensureLib(() => !!window.echarts, [
              () => loadScript("https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js", "echarts-js"),
              () => loadScript("https://unpkg.com/echarts@5.5.1/dist/echarts.min.js", "echarts-js-fb"),
            ]),
            ensureLib(() => !!window.L, [
              () => loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet-js"),
              () => loadScript("https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js", "leaflet-js-fb"),
            ]),
          ]);
          if (!cancelled) setLibsReady((x) => x + 1);
        } catch (libErr) {
          console.warn("chart libs failed", libErr);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!overview?.stations.length) return;
    if (!stationFromUrl) return;
    const ids = overview.stations.map((x) => x.id);
    setStationId(resolveHydroStationId(stationFromUrl, ids));
  }, [stationFromUrl, overview]);

  const selected = useMemo(
    () => overview?.stations.find((s) => s.id === stationId) || overview?.stations[0],
    [overview, stationId]
  );

  const toggle = (id: string) => {
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const renderMainChart = useCallback(() => {
    if (!window.echarts || !chartRef.current || !series || !models || !flood || !stationId) return;
    if (!chartInst.current) chartInst.current = window.echarts.init(chartRef.current);

    const st = series.stations[stationId];
    if (!st) return;
    const lz = series.stations["YR-LZ"];
    const tg = series.stations["YR-TG"];
    const dates = series.dates;
    const ev = flood.events[eventIdx];
    const seriesOpt: any[] = [];

    const pushLine = (name: string, data: number[], color: string, yAxisIndex = 0) => {
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

    if (active.includes("q")) pushLine("流量 Q", st.q, "#2ec4b6");
    if (active.includes("stage")) pushLine("水位 Z", st.stage, "#a8e4f5");
    if (active.includes("precip")) {
      seriesOpt.push({
        name: "降水 P",
        type: "bar",
        yAxisIndex: 1,
        data: st.precip,
        itemStyle: { color: "rgba(61,139,253,0.45)" },
      });
    }
    if (active.includes("temp")) pushLine("气温 T", st.temp, "#e9a825", 1);
    if (active.includes("sediment")) pushLine("含沙量 S", st.sediment, "#c084fc", 1);
    if (active.includes("area")) pushLine("过水面积 A", st.area, "#86efac");
    if (active.includes("compare_lz") && lz) pushLine("兰州流量", lz.q, "#7dd3c0");
    if (active.includes("compare_tg") && tg) pushLine("潼关流量", tg.q, "#5b8def");

    // 模型序列对齐到花园口展示；当前站非花园口时仍可叠加作对照
    if (active.includes("persistence")) pushLine("Persistence", models.series.persistence, "#9a84b5");
    if (active.includes("xgboost")) pushLine("XGBoost", models.series.xgboost, "#ff8fb8");
    if (active.includes("lstm_attention")) pushLine("LSTM-Attention", models.series.lstm_attention, "#3d8bfd");

    if (seriesOpt[0]) {
      seriesOpt[0].markArea = ev
        ? { itemStyle: { color: "rgba(228,87,46,0.12)" }, data: [[{ xAxis: ev.start }, { xAxis: ev.end }]] }
        : undefined;
      seriesOpt[0].markLine = {
        symbol: "none",
        label: { color: "#8fb3c0", fontSize: 10 },
        data: [
          { yAxis: st.warn_q, name: "流量注意", lineStyle: { color: "#e9a825", type: "dashed" } },
          { yAxis: st.alert_q, name: "流量警戒", lineStyle: { color: "#e4572e", type: "dashed" } },
        ],
      };
    }

    chartInst.current.setOption(
      {
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        legend: { textStyle: { color: "#8fb3c0", fontSize: 11 }, top: 0, type: "scroll" },
        grid: { left: 56, right: 46, top: 42, bottom: 36 },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: { color: "#8fb3c0", fontSize: 10 },
          axisLine: { lineStyle: { color: "rgba(120,190,210,0.25)" } },
        },
        yAxis: [
          {
            type: "value",
            name: "m³/s · m · m²",
            nameTextStyle: { color: "#8fb3c0" },
            axisLabel: { color: "#8fb3c0" },
            splitLine: { lineStyle: { color: "rgba(120,190,210,0.08)" } },
          },
          {
            type: "value",
            name: "mm · °C · kg/m³",
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
  }, [active, eventIdx, flood, models, series, stationId]);

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
        name: "m³/s",
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
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      preferCanvas: false,
    });
    mapRef.current.style.background = "#dceaf5";
    addChinaBasemap(L, map);

    // 河网示意：无底图时也能读出黄河—洮河骨架
    L.polyline(YELLOW_RIVER_PATH, {
      color: "#1d4ed8",
      weight: 3.5,
      opacity: 0.85,
      lineJoin: "round",
    })
      .bindTooltip("黄河干流（示意）", { sticky: true })
      .addTo(map);
    L.polyline(TAO_RIVER_PATH, {
      color: "#0d9488",
      weight: 2.5,
      opacity: 0.9,
      dashArray: "6 4",
      lineJoin: "round",
    })
      .bindTooltip("洮河（示意）", { sticky: true })
      .addTo(map);

    const bounds: any[] = [];
    overview.stations.forEach((st) => {
      const selectedMark = st.id === stationId;
      const color = st.status === "alert" ? "#e4572e" : st.status === "warn" ? "#e9a825" : "#0f766e";
      const marker = L.circleMarker([st.lat, st.lon], {
        radius: selectedMark ? 10 : 7,
        color: selectedMark ? "#0f172a" : "#fff",
        fillColor: color,
        fillOpacity: 0.95,
        weight: selectedMark ? 3 : 2,
      }).addTo(map);

      marker.bindTooltip(
        `<b>${st.name}</b><br/>${st.river} · ${st.q} m³/s`,
        {
          permanent: true,
          direction: "right",
          offset: [10, 0],
          className: "hydro-map-label",
          opacity: 1,
        }
      );
      marker.bindPopup(
        `<div style="min-width:140px"><strong>${st.name}</strong>（${st.river}）<br/>
        流域：${st.basin}<br/>
        流量：<b>${st.q}</b> m³/s<br/>
        水位：<b>${st.stage}</b> m<br/>
        含沙：${st.sediment} kg/m³<br/>
        状态：${STATUS[st.status].label}</div>`
      );
      marker.on("click", () => setStationId(st.id));
      bounds.push([st.lat, st.lon]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
    mapInst.current = map;
    setTimeout(() => map.invalidateSize(), 80);
    setTimeout(() => map.invalidateSize(), 350);
  }, [overview, stationId]);

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
  }, [ready, libsReady, renderMainChart, renderForecast, renderCsi, renderMap]);

  useEffect(() => {
    if (!playing || !flood?.events?.length) return;
    const t = setInterval(() => setEventIdx((i) => (i + 1) % flood.events.length), 2200);
    return () => clearInterval(t);
  }, [playing, flood]);

  const m1 = models?.metrics?.["1"]?.["LSTM-Attention"];
  const m3 = models?.metrics?.["3"]?.["LSTM"];
  const m7 = models?.metrics?.["7"]?.["LSTM-Attention"];

  if (error) {
    return (
      <main className="hydro-main">
        <div className="hydro-panel">加载失败：{error}</div>
      </main>
    );
  }
  if (!ready || !overview || !meta || !elements || !flood || !selected) {
    return (
      <main className="hydro-main">
        <div className="hydro-panel">正在装载水情数据包…</div>
      </main>
    );
  }

  const ev = flood.events[eventIdx];
  const stStatus = STATUS[selected.status];

  return (
    <main className="hydro-main">
      <div className="hydro-note">
        {meta.basin} · 数据截止 {meta.as_of} · {meta.note}
        {meta.csv ? (
          <>
            {" "}
            ·{" "}
            <a href={meta.csv} style={{ color: "var(--h-accent)" }}>
              下载 CSV
            </a>
          </>
        ) : null}
      </div>

      <div className="hydro-toolbar">
        <label>
          当前站点
          <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
            {overview.stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.river}（{s.id}）
              </option>
            ))}
          </select>
        </label>
        <div className="hydro-toolbar-meta">
          {selected.basin} · {selected.role} ·{" "}
          <span className={`hydro-badge ${stStatus.cls}`}>{stStatus.label}</span>
        </div>
      </div>

      <section className="hydro-kpi">
        {[
          { label: "流量", value: `${selected.q.toLocaleString()} m³/s`, sub: `Δ ${selected.delta > 0 ? "+" : ""}${selected.delta}` },
          { label: "水位", value: `${selected.stage} m`, sub: `注意 ${selected.warn_stage} / 警戒 ${selected.alert_stage}` },
          { label: "降水", value: `${selected.precip} mm`, sub: "当日" },
          { label: "气温", value: `${selected.temp} °C`, sub: "当日" },
          { label: "含沙量", value: `${selected.sediment} kg/m³`, sub: "悬移质示意" },
          { label: "过水面积", value: `${selected.area.toLocaleString()} m²`, sub: "由 Q/v 推估" },
        ].map((c) => (
          <div className="hydro-card" key={c.label}>
            <div className="label">
              {selected.name} · {c.label}
            </div>
            <div className="value" style={{ fontSize: 22 }}>
              {c.value}
            </div>
            <div className="meta">
              <span>{c.sub}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="hydro-station-strip">
        {overview.stations.map((s) => {
          const st = STATUS[s.status];
          return (
            <button
              key={s.id}
              type="button"
              className={`hydro-station-chip ${s.id === stationId ? "on" : ""}`}
              onClick={() => setStationId(s.id)}
            >
              <strong>{s.name}</strong>
              <span>
                {s.q.toLocaleString()} m³/s · {st.label}
              </span>
            </button>
          );
        })}
      </section>

      <section className="hydro-grid-3">
        <article className="hydro-panel">
          <h2>Leaflet 国内站网地图</h2>
          <p className="desc">高德标准底图 · 黄河/洮河示意河线 · 站名常驻 · 右上角可换底图 · 共 {overview.stations.length} 站</p>
          <div ref={mapRef} className="hydro-map" />
          <div className="hydro-map-legend">
            <span className="lg-yr">黄河干流</span>
            <span className="lg-tao">洮河支流</span>
            <span className="lg-st">水文站</span>
          </div>
        </article>

        <article className="hydro-panel">
          <h2>可变要素出图 · {selected.name}</h2>
          <p className="desc">公制参数：流量/水位/降水/气温/含沙量/过水面积 + 站网对比 + 模型</p>
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
          <div className="hydro-chart-scroll">
            <div ref={chartRef} className="hydro-chart" />
          </div>
        </article>

        <article className="hydro-panel">
          <h2>洪水 CSI 回放</h2>
          <p className="desc">
            {flood.threshold_note} · {Math.round(flood.threshold_m3s).toLocaleString()} m³/s
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
            <button type="button" className="hydro-chip" onClick={() => setEventIdx((i) => (i + 1) % flood.events.length)}>
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
                  <span>{e.peak_q.toLocaleString()} m³/s</span>
                </div>
                <div className="sub">
                  持续 {e.days} 日 · 峰水位 {e.peak_stage} m
                </div>
              </button>
            ))}
          </div>
          {ev && (
            <div className="hydro-metrics" style={{ marginTop: 10 }}>
              <div className="pill">
                当前峰洪 <strong>{ev.peak_q.toLocaleString()}</strong> m³/s
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="hydro-grid-2">
        <article className="hydro-panel">
          <h2>LSTM 推理对接（指标舱）</h2>
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
          <div className="hydro-chart-scroll">
            <div ref={csiChartRef} className="hydro-chart" style={{ height: 260 }} />
          </div>
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
          <h2>7 日业务基线预报 · 花园口</h2>
          <p className="desc">Persistence→MA7；单位 m³/s</p>
          <div className="hydro-chart-scroll">
            <div ref={forecastRef} className="hydro-chart" />
          </div>
          <div className="hydro-metrics">
            <div className="pill">
              起报 <strong>{forecast?.as_of}</strong>
            </div>
            <div className="pill">
              最新流量 <strong>{forecast?.latest_q?.toLocaleString?.()}</strong> m³/s
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
