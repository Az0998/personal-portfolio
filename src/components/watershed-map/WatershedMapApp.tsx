"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, LineString, MultiLineString, Polygon } from "geojson";

type LayerKey = "basin" | "subbasins" | "rivers" | "stations" | "reservoirs" | "slope";

type Stats = {
  stationCount: number;
  reservoirCount: number;
  basinAreaKm2: number;
  subbasinCount: number;
  riverLengthKm: number;
  selectedLabel?: string;
  selectedAreaKm2?: number;
  selectedDistKm?: number;
};

const LAYER_META: { key: LayerKey; label: string; file: string; defaultOn: boolean }[] = [
  { key: "basin", label: "流域边界", file: "basin.geojson", defaultOn: true },
  { key: "subbasins", label: "子流域", file: "subbasins.geojson", defaultOn: true },
  { key: "rivers", label: "水系", file: "rivers.geojson", defaultOn: true },
  { key: "stations", label: "水文站", file: "stations.geojson", defaultOn: true },
  { key: "reservoirs", label: "水库", file: "reservoirs.geojson", defaultOn: true },
  { key: "slope", label: "坡度示意", file: "slope-hint.geojson", defaultOn: false },
];

const SLOPE_COLORS: Record<number, string> = {
  1: "rgba(46, 196, 182, 0.25)",
  2: "rgba(255, 183, 77, 0.35)",
  3: "rgba(231, 76, 60, 0.40)",
};

function stationIcon(kind: "station" | "reservoir") {
  const color = kind === "station" ? "#2ec4b6" : "#5b8def";
  return L.divIcon({
    className: "wm-pin",
    html: `<span class="wm-pin-dot" style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function lineLengthKm(fc: FeatureCollection) {
  let total = 0;
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "LineString") {
      const coords = g.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        total += turf.distance(turf.point(coords[i]), turf.point(coords[i + 1]), {
          units: "kilometers",
        });
      }
    }
  }
  return total;
}

function riversToMultiLine(fc: FeatureCollection): Feature<MultiLineString | LineString> | null {
  const lines: number[][][] = [];
  for (const f of fc.features) {
    if (f.geometry?.type === "LineString") lines.push(f.geometry.coordinates);
  }
  if (!lines.length) return null;
  if (lines.length === 1) return turf.lineString(lines[0]);
  return turf.multiLineString(lines);
}

export function WatershedMapApp() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<Record<LayerKey, L.LayerGroup>>({} as Record<LayerKey, L.LayerGroup>);
  const dataRef = useRef<Partial<Record<LayerKey, FeatureCollection>>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [visibility, setVisibility] = useState<Record<LayerKey, boolean>>(() =>
    Object.fromEntries(LAYER_META.map((l) => [l.key, l.defaultOn])) as Record<LayerKey, boolean>
  );
  const [stats, setStats] = useState<Stats | null>(null);
  const [clickHint, setClickHint] = useState("点击地图任意位置：计算到最近河道距离");

  const computeBaseStats = useCallback((data: Partial<Record<LayerKey, FeatureCollection>>) => {
    const basin = data.basin;
    const stations = data.stations;
    const reservoirs = data.reservoirs;
    const rivers = data.rivers;
    const subbasins = data.subbasins;
    const basinArea =
      basin?.features[0] != null
        ? (basin.features[0].properties?.area_km2 as number) ||
          turf.area(basin.features[0] as Feature<Polygon>) / 1e6
        : 0;
    setStats({
      stationCount: stations?.features.length ?? 0,
      reservoirCount: reservoirs?.features.length ?? 0,
      basinAreaKm2: Math.round(basinArea),
      subbasinCount: subbasins?.features.length ?? 0,
      riverLengthKm: rivers ? Math.round(lineLengthKm(rivers) * 10) / 10 : 0,
    });
  }, []);

  const styleFeature = useCallback((key: LayerKey, feature?: Feature) => {
    if (key === "basin") {
      return {
        color: "#2ec4b6",
        weight: 2.5,
        fillColor: "#2ec4b6",
        fillOpacity: 0.06,
      };
    }
    if (key === "subbasins") {
      return {
        color: "#7bdff2",
        weight: 1.2,
        fillColor: "#1b4332",
        fillOpacity: 0.18,
      };
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

  const bindPopup = useCallback((key: LayerKey, layer: L.Layer, feature: Feature) => {
    const p = feature.properties || {};
    if (key === "stations") {
      (layer as L.Marker).bindPopup(
        `<div class="wm-popup"><b>${p.name_zh || p.name}</b><br/>站码 ${p.id}<br/>角色：${p.role}<br/>距河道约 ${p.dist_to_river_km ?? "—"} km<br/><span class="wm-muted">${p.agency} · ${p.param}</span></div>`
      );
    } else if (key === "reservoirs") {
      (layer as L.Marker).bindPopup(
        `<div class="wm-popup"><b>${p.name_zh || p.name}</b><br/>用途：${p.purpose}<br/>库容示意：${p.capacity_e6m3} ×10⁶ m³</div>`
      );
    } else if (key === "subbasins" || key === "basin") {
      (layer as L.Path).bindPopup(
        `<div class="wm-popup"><b>${p.name || p.name_en}</b><br/>面积：${p.area_km2} km²<br/><span class="wm-muted">${p.note || p.name_en || ""}</span></div>`
      );
    } else if (key === "rivers") {
      (layer as L.Path).bindPopup(
        `<div class="wm-popup"><b>${p.name}</b><br/>河序：${p.stream_order}<br/><span class="wm-muted">${p.name_en}</span></div>`
      );
    } else if (key === "slope") {
      (layer as L.Path).bindPopup(
        `<div class="wm-popup"><b>${p.slope_label}</b><br/>高程代理：${p.elev_proxy_m} m<br/><span class="wm-muted">${p.note}</span></div>`
      );
    }
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, {
      center: [39.15, -77.75],
      zoom: 8,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    (async () => {
      try {
        const loaded: Partial<Record<LayerKey, FeatureCollection>> = {};
        await Promise.all(
          LAYER_META.map(async (meta) => {
            const res = await fetch(`/watershed-map/data/${meta.file}`);
            if (!res.ok) throw new Error(`加载 ${meta.file} 失败`);
            loaded[meta.key] = await res.json();
          })
        );
        dataRef.current = loaded;

        for (const meta of LAYER_META) {
          const fc = loaded[meta.key];
          if (!fc) continue;
          const group = L.layerGroup();
          const geo = L.geoJSON(fc as GeoJSON.GeoJsonObject, {
            style: (feat) => styleFeature(meta.key, feat as Feature),
            pointToLayer: (_feat, latlng) =>
              L.marker(latlng, {
                icon: stationIcon(meta.key === "reservoirs" ? "reservoir" : "station"),
              }),
            onEachFeature: (feat, layer) => bindPopup(meta.key, layer, feat as Feature),
          });
          geo.addTo(group);
          layerGroupRef.current[meta.key] = group;
          if (meta.defaultOn) group.addTo(map);
        }

        const basinLayer = layerGroupRef.current.basin;
        if (basinLayer) {
          const layers = basinLayer.getLayers();
          if (layers[0] && "getBounds" in layers[0]) {
            map.fitBounds((layers[0] as L.GeoJSON).getBounds(), { padding: [40, 40] });
          }
        }

        computeBaseStats(loaded);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "数据加载失败");
      }
    })();

    map.on("click", (e: L.LeafletMouseEvent) => {
      const rivers = dataRef.current.rivers;
      if (!rivers) return;
      const ml = riversToMultiLine(rivers);
      if (!ml) return;
      const pt = turf.point([e.latlng.lng, e.latlng.lat]);
      const snapped = turf.nearestPointOnLine(ml, pt, { units: "kilometers" });
      const distKm = Number(
        snapped.properties?.dist ?? turf.distance(pt, snapped, { units: "kilometers" })
      );
      setClickHint(
        `点击点 (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}) → 距最近河道 ${distKm.toFixed(2)} km`
      );
      setStats((prev) =>
        prev
          ? {
              ...prev,
              selectedLabel: "地图点击点",
              selectedDistKm: Math.round(distKm * 100) / 100,
            }
          : prev
      );

      const marker = L.circleMarker(e.latlng, {
        radius: 6,
        color: "#ffd166",
        fillColor: "#ffd166",
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      marker.bindPopup(`距河道 ${distKm.toFixed(2)} km`).openPopup();
      setTimeout(() => map.removeLayer(marker), 6000);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [bindPopup, computeBaseStats, styleFeature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const meta of LAYER_META) {
      const group = layerGroupRef.current[meta.key];
      if (!group) continue;
      const on = visibility[meta.key];
      if (on && !map.hasLayer(group)) group.addTo(map);
      if (!on && map.hasLayer(group)) map.removeLayer(group);
    }
  }, [visibility, ready]);

  const disclaimer = useMemo(
    () =>
      "教学示意：流域边界与河网已简化；坡度为合成 DEM 示意，不可用于工程设计。站点坐标参考 USGS NWIS。",
    []
  );

  return (
    <div className="wm-shell">
      <aside className="wm-side">
        <div className="wm-brand">
          <div className="wm-kicker">流域一张图 · GIS</div>
          <h1>波托马克河流域</h1>
          <p className="wm-desc">
            公开流域示意：水系 · 子流域 · 水文站 · 水库 · 坡度示意。GeoJSON / EPSG:4326 · Leaflet
          </p>
        </div>

        <section className="wm-panel">
          <h2>图层</h2>
          <div className="wm-layers">
            {LAYER_META.map((l) => (
              <label key={l.key} className="wm-check">
                <input
                  type="checkbox"
                  checked={visibility[l.key]}
                  onChange={(e) =>
                    setVisibility((v) => ({ ...v, [l.key]: e.target.checked }))
                  }
                />
                <span>{l.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="wm-panel">
          <h2>空间统计</h2>
          {!stats ? (
            <p className="wm-muted">加载中…</p>
          ) : (
            <ul className="wm-stats">
              <li>
                <span>流域面积</span>
                <strong>{stats.basinAreaKm2.toLocaleString()} km²</strong>
              </li>
              <li>
                <span>子流域数</span>
                <strong>{stats.subbasinCount}</strong>
              </li>
              <li>
                <span>河网示意长度</span>
                <strong>{stats.riverLengthKm} km</strong>
              </li>
              <li>
                <span>水文站点数</span>
                <strong>{stats.stationCount}</strong>
              </li>
              <li>
                <span>水库点数</span>
                <strong>{stats.reservoirCount}</strong>
              </li>
              {stats.selectedDistKm != null && (
                <li className="wm-accent">
                  <span>{stats.selectedLabel || "选中点"}距河道</span>
                  <strong>{stats.selectedDistKm} km</strong>
                </li>
              )}
            </ul>
          )}
          <p className="wm-hint">{clickHint}</p>
        </section>

        <p className="wm-disclaimer">{disclaimer}</p>
        {error && <p className="wm-error">{error}</p>}
      </aside>

      <div className="wm-map-wrap">
        <div ref={mapEl} className="wm-map" />
        {!ready && !error && <div className="wm-loading">正在加载 GeoJSON 图层…</div>}
      </div>
    </div>
  );
}
