"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { resolveBasemap } from "@/lib/map-basemap";
import {
  type BasinCatalog,
  type BasinManifest,
  featureDetailRows,
  featureTitle,
  featureTypeOf,
  typeLabelZh,
} from "@/lib/watershed-schema";
import { StationSeriesDrawer } from "@/components/watershed-map/StationSeriesDrawer";

type LayerKey = "basin" | "subbasins" | "rivers" | "stations" | "reservoirs" | "slope";

type Stats = {
  stationCount: number | null;
  reservoirCount: number | null;
  basinAreaKm2: number | null;
  subbasinCount: number | null;
  riverLengthKm: number | null;
};

type MeasureResult = {
  clickLat: number;
  clickLng: number;
  snapLat: number;
  snapLng: number;
  distKm: number;
  riverName: string;
  riverId?: string;
  streamOrder?: number;
};

type FeatureDetail = {
  layer: LayerKey;
  title: string;
  code?: string;
  kind: string;
  schematic: boolean;
  seriesPath?: string;
  status?: string;
  rows: { label: string; en: string; value: string }[];
};

type ThresholdStatus = "normal" | "near" | "warn" | "alert";

const STATUS_COLOR: Record<ThresholdStatus, string> = {
  normal: "#2ec4b6",
  near: "#ffd166",
  warn: "#ff9f1c",
  alert: "#e74c3c",
};

const STATUS_ZH: Record<ThresholdStatus, string> = {
  normal: "正常",
  near: "接近警戒",
  warn: "超警戒",
  alert: "超保证",
};

const LAYER_META: { key: LayerKey; label: string; file: string; defaultOn: boolean; lineageKey: string }[] =
  [
    { key: "basin", label: "流域边界", file: "basin.geojson", defaultOn: true, lineageKey: "basin" },
    {
      key: "subbasins",
      label: "子流域",
      file: "subbasins.geojson",
      defaultOn: true,
      lineageKey: "subbasins",
    },
    { key: "rivers", label: "水系", file: "rivers.geojson", defaultOn: true, lineageKey: "rivers" },
    {
      key: "stations",
      label: "水文站",
      file: "stations.geojson",
      defaultOn: true,
      lineageKey: "stations",
    },
    {
      key: "reservoirs",
      label: "水库",
      file: "reservoirs.geojson",
      defaultOn: true,
      lineageKey: "reservoirs",
    },
    {
      key: "slope",
      label: "坡度示意",
      file: "slope-hint.geojson",
      defaultOn: false,
      lineageKey: "slope",
    },
  ];

const SLOPE_COLORS: Record<number, string> = {
  1: "rgba(46, 196, 182, 0.25)",
  2: "rgba(255, 183, 77, 0.35)",
  3: "rgba(231, 76, 60, 0.40)",
};

function statusOf(props?: Record<string, unknown> | null): ThresholdStatus {
  const s = String(props?.status || "normal");
  if (s === "near" || s === "warn" || s === "alert") return s;
  return "normal";
}

function stationIcon(kind: "station" | "reservoir", status: ThresholdStatus = "normal") {
  const color = kind === "reservoir" ? "#5b8def" : STATUS_COLOR[status];
  return L.divIcon({
    className: "wm-pin",
    html: `<span class="wm-pin-dot" style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function formatDist(km: number) {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${(Math.round(km * 100) / 100).toFixed(2)} km`;
}

function lineLengthKm(fc: FeatureCollection) {
  let total = 0;
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g || g.type !== "LineString") continue;
    const len = Number(f.properties?.length_km);
    if (Number.isFinite(len) && len > 0) {
      total += len;
      continue;
    }
    const coords = g.coordinates;
    for (let i = 0; i < coords.length - 1; i++) {
      total += turf.distance(turf.point(coords[i]), turf.point(coords[i + 1]), {
        units: "kilometers",
      });
    }
  }
  return total;
}

function basinAreaKm2(fc?: FeatureCollection) {
  const f = fc?.features[0];
  if (!f) return 0;
  const prop = Number(f.properties?.area_km2);
  if (Number.isFinite(prop) && prop > 0) return prop;
  try {
    return turf.area(f as Feature<Polygon>) / 1e6;
  } catch {
    return 0;
  }
}

function nearestRiver(rivers: FeatureCollection, lng: number, lat: number) {
  const pt = turf.point([lng, lat]);
  let best: {
    distKm: number;
    snap: Feature;
    name: string;
    id?: string;
    streamOrder?: number;
  } | null = null;

  for (const f of rivers.features) {
    if (f.geometry?.type !== "LineString") continue;
    const line = f as Feature<LineString>;
    const snapped = turf.nearestPointOnLine(line, pt, { units: "kilometers" });
    const distKm = Number(
      snapped.properties?.dist ?? turf.distance(pt, snapped, { units: "kilometers" })
    );
    if (!best || distKm < best.distKm) {
      const p = f.properties || {};
      best = {
        distKm,
        snap: snapped,
        name: String(p.name || p.name_zh || p.name_en || "未命名河道"),
        id: p.id != null ? String(p.id) : undefined,
        streamOrder: p.stream_order != null ? Number(p.stream_order) : undefined,
      };
    }
  }
  return best;
}

function featureToDetail(key: LayerKey, feature: Feature): FeatureDetail {
  const p = (feature.properties || {}) as Record<string, unknown>;
  const t = featureTypeOf(p);
  const st = statusOf(p);
  return {
    layer: key,
    title: featureTitle(p),
    code: p.id != null ? String(p.id) : undefined,
    kind: typeLabelZh(t),
    schematic: p.schematic === true,
    seriesPath: typeof p.series === "string" ? p.series : undefined,
    status: key === "stations" ? st : undefined,
    rows: featureDetailRows(p).map((r) =>
      r.en === "status" ? { ...r, value: STATUS_ZH[st] || r.value } : r
    ),
  };
}

function popupHtml(detail: FeatureDetail, basinId: string) {
  const rows = detail.rows
    .filter((r) =>
      ["编码", "类型", "水位示意 (m)", "警戒水位 (m)", "阈值状态", "面积 (km²)", "长度 (km)"].includes(
        r.label
      )
    )
    .slice(0, 5)
    .map((r) => `<div><span class="wm-muted">${r.label}</span> ${r.value}</div>`)
    .join("");
  const badge = detail.schematic
    ? `<span class="wm-schematic-badge">schematic</span>`
    : "";
  const seriesBtn =
    detail.layer === "stations" && detail.code
      ? `<button type="button" class="wm-series-btn" data-station-id="${detail.code}" data-basin-id="${basinId}" data-station-name="${detail.title.replace(/"/g, "")}">查看过程线</button>`
      : "";
  return `<div class="wm-popup"><b>${detail.title}</b>${badge}<div class="wm-muted">${detail.kind}${
    detail.code ? ` · ${detail.code}` : ""
  }</div>${rows}${seriesBtn}<div class="wm-muted">详见左侧「要素详情」</div></div>`;
}

type AppProps = {
  hydroHubUrl?: string;
};

export function WatershedMapApp({ hydroHubUrl = "/hydrobench" }: AppProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<Partial<Record<LayerKey, L.LayerGroup>>>({});
  const dataRef = useRef<Partial<Record<LayerKey, FeatureCollection>>>({});
  const measureGroupRef = useRef<L.LayerGroup | null>(null);
  const visibilityRef = useRef<Record<LayerKey, boolean>>(
    Object.fromEntries(LAYER_META.map((l) => [l.key, l.defaultOn])) as Record<LayerKey, boolean>
  );
  const onFeaturePickRef = useRef<(d: FeatureDetail) => void>(() => {});
  const onMeasureRef = useRef<(m: MeasureResult | null, msg?: string) => void>(() => {});
  const drawMeasureRef = useRef<(result: MeasureResult) => void>(() => {});

  const [catalog, setCatalog] = useState<BasinCatalog | null>(null);
  const [basinId, setBasinId] = useState("potomac");
  const [manifest, setManifest] = useState<BasinManifest | null>(null);
  const [lineageOpen, setLineageOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyNotes, setEmptyNotes] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Record<LayerKey, boolean>>(
    () =>
      Object.fromEntries(LAYER_META.map((l) => [l.key, l.defaultOn])) as Record<LayerKey, boolean>
  );
  const [stats, setStats] = useState<Stats | null>(null);
  const [measure, setMeasure] = useState<MeasureResult | null>(null);
  const [measureMsg, setMeasureMsg] = useState("点击地图空白处：测距到最近河道");
  const [detail, setDetail] = useState<FeatureDetail | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [seriesStationId, setSeriesStationId] = useState<string | null>(null);
  const [seriesStationName, setSeriesStationName] = useState("");
  const [sideOpen, setSideOpen] = useState(true);
  const basinIdRef = useRef(basinId);

  onFeaturePickRef.current = setDetail;
  onMeasureRef.current = (m, msg) => {
    setMeasure(m);
    if (msg) setMeasureMsg(msg);
  };
  basinIdRef.current = basinId;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setSideOpen(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 180);
    return () => window.clearTimeout(t);
  }, [sideOpen]);

  const openSeries = useCallback((id: string, name?: string) => {
    setSeriesStationId(id);
    setSeriesStationName(name || id);
    setSeriesOpen(true);
  }, []);

  const recomputeStats = useCallback(
    (data: Partial<Record<LayerKey, FeatureCollection>>, vis: Record<LayerKey, boolean>) => {
      setStats({
        basinAreaKm2: vis.basin ? Math.round(basinAreaKm2(data.basin)) : null,
        subbasinCount: vis.subbasins ? data.subbasins?.features.length ?? 0 : null,
        riverLengthKm: vis.rivers
          ? data.rivers
            ? Math.round(lineLengthKm(data.rivers) * 10) / 10
            : 0
          : null,
        stationCount: vis.stations ? data.stations?.features.length ?? 0 : null,
        reservoirCount: vis.reservoirs ? data.reservoirs?.features.length ?? 0 : null,
      });
    },
    []
  );

  const styleFeature = useCallback((key: LayerKey, feature?: Feature) => {
    if (key === "basin") {
      return { color: "#2ec4b6", weight: 2.5, fillColor: "#2ec4b6", fillOpacity: 0.06 };
    }
    if (key === "subbasins") {
      return { color: "#7bdff2", weight: 1.2, fillColor: "#1b4332", fillOpacity: 0.18 };
    }
    if (key === "rivers") {
      const order = Number(feature?.properties?.stream_order ?? 2);
      return {
        color: order === 1 ? "#4cc9f0" : "#89c2d9",
        weight: order === 1 ? 3.5 : order === 2 ? 2.2 : 1.4,
        opacity: 0.95,
      };
    }
    if (key === "slope") {
      const cls = Number(feature?.properties?.slope_class ?? 1);
      return {
        color: "transparent",
        weight: 0,
        fillColor: SLOPE_COLORS[cls] || SLOPE_COLORS[1],
        fillOpacity: 1,
      };
    }
    return {};
  }, []);

  const mountLayerGroup = useCallback(
    (meta: (typeof LAYER_META)[number], fc: FeatureCollection, map: L.Map) => {
      const group = L.layerGroup();
      const geo = L.geoJSON(fc as GeoJSON.GeoJsonObject, {
        style: (feat) => styleFeature(meta.key, feat as Feature),
        pointToLayer: (feat, latlng) => {
          if (meta.key === "reservoirs") {
            return L.marker(latlng, { icon: stationIcon("reservoir") });
          }
          const st = statusOf((feat.properties || {}) as Record<string, unknown>);
          return L.marker(latlng, { icon: stationIcon("station", st) });
        },
        onEachFeature: (feat, layer) => {
          const d = featureToDetail(meta.key, feat as Feature);
          layer.bindPopup(popupHtml(d, basinIdRef.current));
          layer.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            onFeaturePickRef.current(d);
          });
        },
      });
      geo.addTo(group);
      layerGroupRef.current[meta.key] = group;
      if (visibilityRef.current[meta.key]) group.addTo(map);
    },
    [styleFeature]
  );

  const drawMeasure = useCallback((result: MeasureResult) => {
    measureGroupRef.current?.clearLayers();
    const group = measureGroupRef.current;
    if (!group) return;

    const from: L.LatLngExpression = [result.clickLat, result.clickLng];
    const to: L.LatLngExpression = [result.snapLat, result.snapLng];

    L.polyline([from, to], {
      color: "#ffd166",
      weight: 2.5,
      dashArray: "8 8",
      opacity: 0.95,
      interactive: false,
    }).addTo(group);

    L.circleMarker(from, {
      radius: 6,
      color: "#ffd166",
      fillColor: "#ffd166",
      fillOpacity: 0.95,
      weight: 2,
      interactive: false,
    }).addTo(group);

    const snap = L.circleMarker(to, {
      radius: 5,
      color: "#fff",
      fillColor: "#ff9f1c",
      fillOpacity: 1,
      weight: 2,
      interactive: false,
    }).addTo(group);

    snap.bindTooltip(`${result.riverName} · ${formatDist(result.distKm)}`, {
      permanent: true,
      direction: "top",
      className: "wm-measure-tip",
      offset: [0, -8],
    });
  }, []);

  drawMeasureRef.current = drawMeasure;

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    let cancelled = false;

    const map = L.map(mapEl.current, {
      center: [39.15, -77.75],
      zoom: 8,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const basemap = resolveBasemap("dark");
    L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: basemap.maxZoom ?? 18,
      ...(basemap.subdomains ? { subdomains: basemap.subdomains } : {}),
      ...(basemap.className ? { className: basemap.className } : {}),
    }).addTo(map);

    measureGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    const onPopupClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      const btn = t?.closest?.(".wm-series-btn") as HTMLElement | null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      const id = btn.getAttribute("data-station-id");
      const name = btn.getAttribute("data-station-name") || undefined;
      if (id) openSeries(id, name);
    };
    map.getContainer().addEventListener("click", onPopupClick);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (cancelled || !mapRef.current) return;
      if (!visibilityRef.current.rivers) {
        measureGroupRef.current?.clearLayers();
        onMeasureRef.current(null, "请先开启「水系」图层，再点击地图测距");
        return;
      }
      const rivers = dataRef.current.rivers;
      if (!rivers?.features?.length) {
        measureGroupRef.current?.clearLayers();
        onMeasureRef.current(null, "水系数据为空，无法测距");
        return;
      }
      const best = nearestRiver(rivers, e.latlng.lng, e.latlng.lat);
      if (!best) {
        measureGroupRef.current?.clearLayers();
        onMeasureRef.current(null, "未找到可用河道线");
        return;
      }
      const [snapLng, snapLat] =
        best.snap.geometry.type === "Point"
          ? (best.snap.geometry.coordinates as [number, number])
          : [e.latlng.lng, e.latlng.lat];
      const result: MeasureResult = {
        clickLat: e.latlng.lat,
        clickLng: e.latlng.lng,
        snapLat,
        snapLng,
        distKm: best.distKm,
        riverName: best.name,
        riverId: best.id,
        streamOrder: best.streamOrder,
      };
      drawMeasureRef.current(result);
      onMeasureRef.current(
        result,
        `点击 (${result.clickLat.toFixed(4)}, ${result.clickLng.toFixed(4)}) → ${result.riverName}`
      );
    });

    return () => {
      cancelled = true;
      map.getContainer().removeEventListener("click", onPopupClick);
      map.remove();
      mapRef.current = null;
      measureGroupRef.current = null;
      setMapReady(false);
    };
  }, [openSeries]);

  // Load catalog
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/watershed-map/catalog.json");
        if (!res.ok) throw new Error("目录加载失败");
        const cat = (await res.json()) as BasinCatalog;
        if (cancelled) return;
        setCatalog(cat);
        setBasinId(cat.default || cat.basins[0]?.id || "potomac");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "无法加载流域目录");
          setBasinId("potomac");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load basin layers when basinId / map ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || !basinId) return;
    let cancelled = false;
    const map = mapRef.current;

    (async () => {
      setLoading(true);
      setReady(false);
      setError("");
      setDetail(null);
      setMeasure(null);
      setMeasureMsg("点击地图空白处：测距到最近河道");
      measureGroupRef.current?.clearLayers();

      for (const key of Object.keys(layerGroupRef.current) as LayerKey[]) {
        const g = layerGroupRef.current[key];
        if (g && map.hasLayer(g)) map.removeLayer(g);
      }
      layerGroupRef.current = {};
      dataRef.current = {};

      try {
        const base = `/watershed-map/basins/${basinId}`;
        const manRes = await fetch(`${base}/manifest.json`);
        if (!manRes.ok) throw new Error(`无法加载 ${basinId} 的 manifest`);
        const man = (await manRes.json()) as BasinManifest;
        if (cancelled) return;
        setManifest(man);

        const loaded: Partial<Record<LayerKey, FeatureCollection>> = {};
        const empties: string[] = [];
        const failures: string[] = [];

        await Promise.all(
          LAYER_META.filter((m) => m.key !== "slope").map(async (meta) => {
            try {
              const res = await fetch(`${base}/${meta.file}`);
              if (!res.ok) {
                failures.push(`${meta.label}（${meta.file}）`);
                return;
              }
              const fc = (await res.json()) as FeatureCollection;
              loaded[meta.key] = fc;
              if (!fc.features?.length) empties.push(meta.label);
            } catch {
              failures.push(`${meta.label}（${meta.file}）`);
            }
          })
        );

        if (cancelled || !mapRef.current) return;

        if (failures.length === LAYER_META.filter((m) => m.key !== "slope").length) {
          throw new Error(`全部图层加载失败：${failures.join("、")}`);
        }

        dataRef.current = loaded;
        setEmptyNotes(empties);

        for (const meta of LAYER_META) {
          const fc = loaded[meta.key];
          if (!fc) continue;
          mountLayerGroup(meta, fc, map);
        }

        if (failures.length) {
          setError(`部分图层未加载：${failures.join("、")}。其余图层仍可使用。`);
        }

        const basinLayer = layerGroupRef.current.basin;
        if (basinLayer) {
          const layers = basinLayer.getLayers();
          if (layers[0] && "getBounds" in layers[0]) {
            map.fitBounds((layers[0] as L.GeoJSON).getBounds(), { padding: [40, 40] });
          }
        } else if (man.center) {
          map.setView(man.center, man.zoom ?? 7);
        }

        recomputeStats(loaded, visibilityRef.current);
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          setReady(false);
          setManifest(null);
          setError(e instanceof Error ? e.message : "数据加载失败，请刷新重试");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [basinId, mapReady, mountLayerGroup, recomputeStats]);

  useEffect(() => {
    visibilityRef.current = visibility;
    const map = mapRef.current;
    if (!map || !ready) return;

    let cancelled = false;
    (async () => {
      if (visibility.slope && !layerGroupRef.current.slope) {
        try {
          const res = await fetch(
            `/watershed-map/basins/${basinIdRef.current}/slope-hint.geojson`
          );
          if (!res.ok) throw new Error("坡度层加载失败");
          const fc = (await res.json()) as FeatureCollection;
          if (cancelled || !mapRef.current) return;
          dataRef.current.slope = fc;
          const meta = LAYER_META.find((m) => m.key === "slope")!;
          mountLayerGroup(meta, fc, mapRef.current);
        } catch {
          if (!cancelled) setError((e) => e || "坡度示意层加载失败（不影响其它图层）");
        }
      }

      if (cancelled || !mapRef.current) return;
      for (const meta of LAYER_META) {
        const group = layerGroupRef.current[meta.key];
        if (!group) continue;
        const on = visibility[meta.key];
        if (on && !map.hasLayer(group)) group.addTo(map);
        if (!on && map.hasLayer(group)) map.removeLayer(group);
      }
      recomputeStats(dataRef.current, visibility);

      if (!visibility.rivers) {
        measureGroupRef.current?.clearLayers();
        setMeasure(null);
        setMeasureMsg("水系图层已关闭：开启后可点击地图测距");
      } else {
        setMeasureMsg((prev) =>
          prev.startsWith("水系图层已关闭") || prev.startsWith("请先开启")
            ? "点击地图空白处：测距到最近河道"
            : prev
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibility, ready, recomputeStats, mountLayerGroup]);

  const retry = () => window.location.reload();

  const statLine = (label: string, value: string | null, hidden: boolean) => (
    <li>
      <span>
        {label}
        {hidden ? <em className="wm-off">隐藏</em> : null}
      </span>
      <strong>{hidden ? "—" : value ?? "—"}</strong>
    </li>
  );

  return (
    <div className={`wm-shell${sideOpen ? "" : " wm-side-collapsed"}`}>
      <button
        type="button"
        className="wm-side-toggle"
        aria-expanded={sideOpen}
        aria-controls="wm-side-panel"
        onClick={() => setSideOpen((o) => !o)}
      >
        {sideOpen ? "收起面板" : "图层与统计"}
      </button>

      <aside id="wm-side-panel" className="wm-side" hidden={!sideOpen} aria-hidden={!sideOpen}>
        <div className="wm-brand">
          <div className="wm-kicker">流域一张图 · GIS · schematic</div>
          <h1>{manifest?.title || "流域示意"}</h1>
          <p className="wm-desc">
            {manifest?.title_en || "Schematic basin"} · GeoJSON · EPSG:4326 · Leaflet
            {manifest?.schematic ? " · 示意数据" : ""}
          </p>
        </div>

        <section className="wm-panel">
          <h2>示范流域</h2>
          <div className="wm-basin-switch" role="group" aria-label="切换示范流域">
            {(catalog?.basins || [
              { id: "potomac", title: "波托马克", schematic: true, path: "basins/potomac" },
            ]).map((b) => (
              <button
                key={b.id}
                type="button"
                className={basinId === b.id ? "wm-basin-btn active" : "wm-basin-btn"}
                disabled={loading}
                onClick={() => setBasinId(b.id)}
              >
                {b.title}
                {b.schematic ? <span className="wm-tag">schematic</span> : null}
              </button>
            ))}
          </div>
          <p className="wm-hint">默认 Potomac；可切换中国示范流域（均为示意几何）。</p>
        </section>

        <section className="wm-panel">
          <button
            type="button"
            className="wm-fold-btn"
            aria-expanded={lineageOpen}
            onClick={() => setLineageOpen((o) => !o)}
          >
            <h2>数据说明</h2>
            <span aria-hidden>{lineageOpen ? "▾" : "▸"}</span>
          </button>
          {lineageOpen && (
            <div className="wm-lineage">
              <ul className="wm-stats wm-lineage-meta">
                <li>
                  <span>坐标系</span>
                  <strong>EPSG:{manifest?.epsg ?? 4326}</strong>
                </li>
                <li>
                  <span>数据性质</span>
                  <strong>{manifest?.schematic !== false ? "schematic 示意" : "—"}</strong>
                </li>
                <li>
                  <span>名义面积</span>
                  <strong>
                    {manifest?.area_km2_nominal != null
                      ? `${manifest.area_km2_nominal.toLocaleString()} km²`
                      : "—"}
                  </strong>
                </li>
                <li>
                  <span>属性字典</span>
                  <strong>
                    <a href="/watershed-map/schema.json" target="_blank" rel="noreferrer">
                      schema.json
                    </a>
                  </strong>
                </li>
              </ul>
              <div className="wm-lineage-list">
                <div className="wm-lineage-block">
                  <strong>数据谱系</strong>
                  <p>按图层说明来源与示意程度；切换图层后右侧统计只计可见要素。</p>
                </div>
                {LAYER_META.map((l) => (
                  <div key={l.key} className="wm-lineage-item">
                    <strong>{l.label}</strong>
                    <p>{manifest?.lineage?.[l.lineageKey] || "—"}</p>
                  </div>
                ))}
                <div className="wm-lineage-block">
                  <strong>示意免责</strong>
                  <p>
                    {manifest?.disclaimer ||
                      "教学示意数据：边界与河网已简化；坡度为合成 DEM 示意，不可用于工程设计或报汛决策。"}
                  </p>
                  <p className="wm-warn">
                    坡度图层仅为合成 DEM 代理分级，禁止当作实测地形或工程依据。
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="wm-panel">
          <h2>图层</h2>
          <div className="wm-layers">
            {LAYER_META.map((l) => (
              <label key={l.key} className="wm-check">
                <input
                  type="checkbox"
                  checked={visibility[l.key]}
                  disabled={!ready}
                  onChange={(e) =>
                    setVisibility((v) => ({ ...v, [l.key]: e.target.checked }))
                  }
                />
                <span>{l.label}</span>
              </label>
            ))}
          </div>
          <div className="wm-legend">
            <span className="wm-legend-title">水位阈值示意</span>
            {(Object.keys(STATUS_COLOR) as ThresholdStatus[]).map((k) => (
              <span key={k} className="wm-legend-item">
                <i style={{ background: STATUS_COLOR[k] }} />
                {STATUS_ZH[k]}
              </span>
            ))}
          </div>
        </section>

        <section className="wm-panel">
          <h2>空间统计</h2>
          {loading && !stats ? (
            <p className="wm-muted">正在汇总可见图层…</p>
          ) : !stats ? (
            <p className="wm-muted">暂无统计数据</p>
          ) : (
            <ul className="wm-stats">
              {statLine(
                "流域面积",
                stats.basinAreaKm2 != null
                  ? `${stats.basinAreaKm2.toLocaleString()} km²`
                  : null,
                !visibility.basin
              )}
              {statLine(
                "子流域数",
                stats.subbasinCount != null ? String(stats.subbasinCount) : null,
                !visibility.subbasins
              )}
              {statLine(
                "河网示意长度",
                stats.riverLengthKm != null ? `${stats.riverLengthKm} km` : null,
                !visibility.rivers
              )}
              {statLine(
                "水文站点数",
                stats.stationCount != null ? String(stats.stationCount) : null,
                !visibility.stations
              )}
              {statLine(
                "水库点数",
                stats.reservoirCount != null ? String(stats.reservoirCount) : null,
                !visibility.reservoirs
              )}
            </ul>
          )}
          <p className="wm-hint">统计仅计入当前勾选的可见图层。</p>
        </section>

        <section className="wm-panel wm-panel-measure">
          <h2>测距结果</h2>
          {measure ? (
            <ul className="wm-stats">
              <li>
                <span>最近河道</span>
                <strong>{measure.riverName}</strong>
              </li>
              {measure.riverId && (
                <li>
                  <span>河道编码</span>
                  <strong>{measure.riverId}</strong>
                </li>
              )}
              {measure.streamOrder != null && (
                <li>
                  <span>河序</span>
                  <strong>{measure.streamOrder}</strong>
                </li>
              )}
              <li className="wm-accent">
                <span>距离</span>
                <strong>{formatDist(measure.distKm)}</strong>
              </li>
              <li>
                <span>点击坐标</span>
                <strong>
                  {measure.clickLat.toFixed(4)}, {measure.clickLng.toFixed(4)}
                </strong>
              </li>
            </ul>
          ) : (
            <p className="wm-muted">{measureMsg}</p>
          )}
          {measure && (
            <p className="wm-hint">地图上黄虚线连接点击点与河道最近点。</p>
          )}
        </section>

        <section className="wm-panel">
          <div className="wm-panel-head">
            <h2>要素详情</h2>
            {detail && (
              <button type="button" className="wm-clear" onClick={() => setDetail(null)}>
                清除
              </button>
            )}
          </div>
          {detail ? (
            <>
              <div className="wm-detail-title">
                {detail.title}
                {detail.schematic ? <span className="wm-tag">schematic</span> : null}
              </div>
              <div className="wm-detail-meta">
                {detail.kind}
                {detail.code ? ` · ${detail.code}` : ""}
                {detail.status ? ` · ${STATUS_ZH[detail.status as ThresholdStatus] || detail.status}` : ""}
              </div>
              <ul className="wm-stats">
                {detail.rows.map((r) => (
                  <li key={`${r.en}-${r.label}`}>
                    <span title={r.en}>{r.label}</span>
                    <strong>{r.value}</strong>
                  </li>
                ))}
              </ul>
              {detail.layer === "stations" && detail.code && (
                <button
                  type="button"
                  className="wm-series-open"
                  onClick={() => openSeries(detail.code!, detail.title)}
                >
                  查看过程线
                </button>
              )}
            </>
          ) : (
            <p className="wm-muted">点击要素查看统一属性字典字段；缺失显示「—」。</p>
          )}
        </section>

        {emptyNotes.length > 0 && (
          <p className="wm-warn">空图层：{emptyNotes.join("、")}（文件存在但无要素）。</p>
        )}
        {error && (
          <div className="wm-error-box">
            <p className="wm-error">{error}</p>
            <button type="button" className="wm-retry" onClick={retry}>
              刷新重试
            </button>
          </div>
        )}
      </aside>

      <div className="wm-map-wrap">
        <div ref={mapEl} className="wm-map" />
        {loading && (
          <div className="wm-loading" role="status">
            正在加载 {manifest?.title || basinId} GeoJSON…
          </div>
        )}
        {!loading && error && !ready && (
          <div className="wm-loading wm-loading-error" role="alert">
            <p>地图数据未能加载</p>
            <p className="wm-muted">{error}</p>
            <button type="button" className="wm-retry" onClick={retry}>
              刷新重试
            </button>
          </div>
        )}
        {measure && (
          <div className="wm-float-measure" aria-live="polite">
            <span className="wm-float-kicker">最近河道</span>
            <strong>{measure.riverName}</strong>
            <span className="wm-float-dist">{formatDist(measure.distKm)}</span>
          </div>
        )}
      </div>

      <StationSeriesDrawer
        open={seriesOpen}
        basinId={basinId}
        stationId={seriesStationId}
        stationName={seriesStationName}
        hydroHubUrl={hydroHubUrl}
        onClose={() => setSeriesOpen(false)}
      />
    </div>
  );
}
