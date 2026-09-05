# -*- coding: utf-8 -*-
"""Generate schematic watershed GeoJSON basins for /watershed-map.

All geometries are educational schematics (schematic=true). Do not treat as
survey-grade boundaries. Coordinates: EPSG:4326 (lon, lat).
"""
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1]  # modules/watershed-map
REPO = Path(__file__).resolve().parents[3]  # personal-portfolio
DATA = MODULE / "data" / "geojson"  # canonical (pretty) source
PUBLIC = REPO / "public" / "watershed-map"  # Next static mount (compact)
BASINS = DATA / "basins"
LEGACY = PUBLIC / "data"


def derive_status(stage: float, warn: float, alert: float) -> str:
    if stage >= alert:
        return "alert"
    if stage >= warn:
        return "warn"
    if stage >= warn * 0.92:
        return "near"
    return "normal"


def schematic_series(station: dict, days: int = 30) -> dict:
    """Synthetic stage/q hydrograph for drawer mini-chart (schematic only)."""
    import random

    rng = random.Random(hash(station["id"]) & 0xFFFFFFFF)
    stage0 = float(station.get("stage", 2.0))
    q0 = float(station.get("q", 100.0))
    warn = float(station.get("warn_stage", stage0 + 1))
    alert = float(station.get("alert_stage", stage0 + 2))
    points = []
    for i in range(days):
        wobble = math.sin(i / 4.2) * 0.35 + rng.uniform(-0.15, 0.15)
        pulse = 0.55 if 18 <= i <= 22 else 0.0
        stage = round(stage0 + wobble + pulse, 2)
        q = round(max(1.0, q0 * (1 + wobble * 0.25 + pulse * 0.4)), 1)
        points.append({"t": f"2024-11-{i + 1:02d}", "q": q, "stage": stage})
    return {
        "station_id": station["id"],
        "name": station.get("name_zh") or station["name"],
        "schematic": True,
        "unit_q": "m³/s",
        "unit_stage": "m",
        "warn_stage": warn,
        "alert_stage": alert,
        "warn_q": station.get("warn_q"),
        "alert_q": station.get("alert_q"),
        "points": points,
        "note": "示意过程线，非实测报汛序列",
    }


def write_series_files(out: Path, stations: list) -> None:
    series_dir = out / "series"
    series_dir.mkdir(parents=True, exist_ok=True)
    for s in stations:
        payload = schematic_series(s)
        sid = s["id"]
        (series_dir / f"{sid}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        csv_lines = ["date,q_m3s,stage_m"]
        for p in payload["points"]:
            csv_lines.append(f"{p['t']},{p['q']},{p['stage']}")
        (series_dir / f"{sid}.csv").write_text("\n".join(csv_lines) + "\n", encoding="utf-8")
    print(f"wrote {len(stations)} series under {series_dir}")


def haversine_km(lon1, lat1, lon2, lat2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def line_length_km(coords):
    total = 0.0
    for i in range(len(coords) - 1):
        a, b = coords[i], coords[i + 1]
        total += haversine_km(a[0], a[1], b[0], b[1])
    return round(total, 1)


def point_to_segment_km(px, py, ax, ay, bx, by):
    lat0 = math.radians((ay + by + py) / 3)
    kx = 111.32 * math.cos(lat0)
    ky = 110.57
    ax2, ay2 = ax * kx, ay * ky
    bx2, by2 = bx * kx, by * ky
    px2, py2 = px * kx, py * ky
    dx, dy = bx2 - ax2, by2 - ay2
    if dx == 0 and dy == 0:
        return math.hypot(px2 - ax2, py2 - ay2)
    t = max(0, min(1, ((px2 - ax2) * dx + (py2 - ay2) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px2 - (ax2 + t * dx), py2 - (ay2 + t * dy))


def dist_to_rivers_km(lon, lat, rivers):
    best = 1e9
    for riv in rivers:
        coords = riv["coords"]
        for i in range(len(coords) - 1):
            a, b = coords[i], coords[i + 1]
            best = min(best, point_to_segment_km(lon, lat, a[0], a[1], b[0], b[1]))
    return round(best, 2)


def fc(name: str, features: list) -> dict:
    return {
        "type": "FeatureCollection",
        "name": name,
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": features,
    }


def dump(dir_path: Path, filename: str, collection: dict, *, pretty: bool = True) -> None:
    dir_path.mkdir(parents=True, exist_ok=True)
    path = dir_path / filename
    if pretty:
        text = json.dumps(collection, ensure_ascii=False, indent=2)
    else:
        text = json.dumps(collection, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    kb = path.stat().st_size / 1024
    print(f"wrote {path} ({len(collection.get('features', []))} features, {kb:.1f} KB)")


def slope_cells(bbox, n=6):
    lon0, lon1, lat0, lat1 = bbox
    cells = []
    for i in range(n):
        for j in range(n):
            a = lon0 + (lon1 - lon0) * i / n
            b = lon0 + (lon1 - lon0) * (i + 1) / n
            c = lat0 + (lat1 - lat0) * j / n
            d = lat0 + (lat1 - lat0) * (j + 1) / n
            cx, cy = (a + b) / 2, (c + d) / 2
            # Synthetic surface only — not a real DEM
            elev = (lat1 - cy) * 120 + (lon0 - cx) * 30 + 200
            slope = abs((cx - lon0) * 0.5) + abs((cy - (lat0 + lat1) / 2) * 1.8)
            if slope < 1.0:
                cls, label = 1, "缓坡示意"
            elif slope < 2.0:
                cls, label = 2, "中坡示意"
            else:
                cls, label = 3, "陡坡示意"
            cells.append(
                {
                    "type": "Feature",
                    "properties": {
                        "id": f"SLP-{i:02d}-{j:02d}",
                        "name": label,
                        "name_en": label,
                        "type": "slope_cell",
                        "schematic": True,
                        "slope_class": cls,
                        "slope_label": label,
                        "elev_proxy_m": round(max(20, elev), 0),
                        "note": "合成 DEM 派生示意，非实测坡度",
                        "source": "synthetic DEM proxy (schematic)",
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[a, c], [b, c], [b, d], [a, d], [a, c]]],
                    },
                }
            )
    return cells


def write_basin(basin_id: str, meta: dict, data: dict) -> None:
    out = BASINS / basin_id
    rivers = data["rivers"]

    dump(
        out,
        "basin.geojson",
        fc(
            f"{basin_id}_basin",
            [
                {
                    "type": "Feature",
                    "properties": {
                        "id": data["basin"]["id"],
                        "name": data["basin"]["name"],
                        "name_en": data["basin"]["name_en"],
                        "type": "basin",
                        "schematic": True,
                        "area_km2": data["basin"]["area_km2"],
                        "outlet_id": data["basin"].get("outlet_id"),
                        "note": data["basin"].get("note"),
                        "source": data["basin"].get("source"),
                    },
                    "geometry": {"type": "Polygon", "coordinates": [data["basin"]["ring"]]},
                }
            ],
        ),
    )

    dump(
        out,
        "subbasins.geojson",
        fc(
            f"{basin_id}_subbasins",
            [
                {
                    "type": "Feature",
                    "properties": {
                        "id": sb["id"],
                        "name": sb["name"],
                        "name_en": sb["name_en"],
                        "type": "subbasin",
                        "schematic": True,
                        "area_km2": sb["area_km2"],
                        "note": sb.get("note", "子流域示意分区"),
                        "source": sb.get("source", meta["lineage"]["subbasins"]),
                    },
                    "geometry": {"type": "Polygon", "coordinates": [sb["ring"]]},
                }
                for sb in data["subbasins"]
            ],
        ),
    )

    dump(
        out,
        "rivers.geojson",
        fc(
            f"{basin_id}_rivers",
            [
                {
                    "type": "Feature",
                    "properties": {
                        "id": r["id"],
                        "name": r["name"],
                        "name_en": r["name_en"],
                        "type": "river",
                        "schematic": True,
                        "stream_order": r["order"],
                        "length_km": line_length_km(r["coords"]),
                        "note": r.get("note", "河网折线已简化"),
                        "source": r.get("source", meta["lineage"]["rivers"]),
                    },
                    "geometry": {"type": "LineString", "coordinates": r["coords"]},
                }
                for r in rivers
            ],
        ),
    )

    station_features = []
    for s in data["stations"]:
        stage = float(s.get("stage", 0))
        warn_stage = float(s.get("warn_stage", stage + 1))
        alert_stage = float(s.get("alert_stage", stage + 2))
        status = s.get("status") or derive_status(stage, warn_stage, alert_stage)
        station_features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": s["id"],
                    "name": s.get("name_zh") or s["name"],
                    "name_en": s["name"],
                    "type": "station",
                    "schematic": True,
                    "role": s.get("role"),
                    "agency": s.get("agency"),
                    "param": s.get("param"),
                    "q": s.get("q"),
                    "stage": stage,
                    "warn_stage": warn_stage,
                    "alert_stage": alert_stage,
                    "warn_q": s.get("warn_q"),
                    "alert_q": s.get("alert_q"),
                    "status": status,
                    "dist_to_river_km": dist_to_rivers_km(s["lon"], s["lat"], rivers),
                    "series": f"series/{s['id']}.json",
                    "note": s.get("note", "站点位置示意/近似"),
                    "source": s.get("source", meta["lineage"]["stations"]),
                },
                "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
            }
        )
    dump(out, "stations.geojson", fc(f"{basin_id}_stations", station_features))
    write_series_files(out, data["stations"])

    dump(
        out,
        "reservoirs.geojson",
        fc(
            f"{basin_id}_reservoirs",
            [
                {
                    "type": "Feature",
                    "properties": {
                        "id": r["id"],
                        "name": r.get("name_zh") or r["name"],
                        "name_en": r["name"],
                        "type": "reservoir",
                        "schematic": True,
                        "purpose": r.get("purpose"),
                        "capacity_e6m3": r.get("capacity_e6m3"),
                        "note": r.get("note", "库容为示意量级"),
                        "source": r.get("source", meta["lineage"]["reservoirs"]),
                    },
                    "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
                }
                for r in data["reservoirs"]
            ],
        ),
    )

    dump(out, "slope-hint.geojson", fc(f"{basin_id}_slope_hint", slope_cells(data["slope_bbox"])))

    manifest = {
        **meta,
        "id": basin_id,
        "epsg": 4326,
        "schematic": True,
        "layers": [
            "basin.geojson",
            "subbasins.geojson",
            "rivers.geojson",
            "stations.geojson",
            "reservoirs.geojson",
            "slope-hint.geojson",
        ],
        "property_schema": "/watershed-map/schema.json",
    }
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("manifest", out / "manifest.json")


# ----- Potomac (default) -----
POTOMAC = {
    "basin": {
        "id": "BASIN-POTOMAC",
        "name": "波托马克河流域",
        "name_en": "Potomac River Basin",
        "area_km2": 14670,
        "outlet_id": "01646500",
        "note": "教育示意边界，非官方精确划界；名义面积约 14670 km²",
        "source": "hand-digitized schematic outline (educational)",
        "ring": [
            [-79.48, 39.72], [-78.95, 39.95], [-78.20, 39.88], [-77.55, 39.70],
            [-77.05, 39.35], [-76.85, 38.95], [-76.95, 38.55], [-77.25, 38.35],
            [-77.85, 38.45], [-78.55, 38.70], [-79.15, 39.05], [-79.48, 39.45],
            [-79.48, 39.72],
        ],
    },
    "subbasins": [
        {
            "id": "SB-SHEN",
            "name": "Shenandoah 子流域",
            "name_en": "Shenandoah Subbasin",
            "area_km2": 3040,
            "ring": [
                [-79.20, 39.45], [-78.70, 39.55], [-78.15, 39.35], [-77.85, 39.05],
                [-78.05, 38.75], [-78.55, 38.70], [-79.05, 38.95], [-79.20, 39.25],
                [-79.20, 39.45],
            ],
        },
        {
            "id": "SB-NORTH",
            "name": "北支 Potomac 子流域",
            "name_en": "North Branch Potomac",
            "area_km2": 3480,
            "ring": [
                [-79.48, 39.55], [-79.00, 39.85], [-78.35, 39.75], [-78.10, 39.45],
                [-78.45, 39.20], [-79.05, 39.15], [-79.48, 39.35], [-79.48, 39.55],
            ],
        },
        {
            "id": "SB-MONO",
            "name": "Monocacy 子流域",
            "name_en": "Monocacy Subbasin",
            "area_km2": 1880,
            "ring": [
                [-77.70, 39.70], [-77.20, 39.65], [-77.00, 39.35], [-77.15, 39.05],
                [-77.55, 39.10], [-77.75, 39.35], [-77.70, 39.70],
            ],
        },
        {
            "id": "SB-LOWER",
            "name": "下游潮汐段子流域",
            "name_en": "Lower Potomac Tidal",
            "area_km2": 6270,
            "ring": [
                [-77.55, 39.10], [-77.05, 39.20], [-76.85, 38.85], [-76.95, 38.45],
                [-77.35, 38.40], [-77.75, 38.65], [-77.70, 38.95], [-77.55, 39.10],
            ],
        },
    ],
    "rivers": [
        {
            "id": "R-MAIN",
            "name": "Potomac 干流",
            "name_en": "Potomac Main Stem",
            "order": 1,
            "coords": [
                [-79.35, 39.40], [-78.95, 39.35], [-78.55, 39.30], [-78.10, 39.28],
                [-77.73, 39.32], [-77.45, 39.20], [-77.25, 39.05], [-77.13, 38.95],
                [-77.05, 38.80], [-77.02, 38.60],
            ],
        },
        {
            "id": "R-SHEN",
            "name": "Shenandoah 河",
            "name_en": "Shenandoah River",
            "order": 2,
            "coords": [
                [-78.85, 38.80], [-78.55, 38.90], [-78.25, 39.05], [-77.95, 39.20],
                [-77.79, 39.29], [-77.73, 39.32],
            ],
        },
        {
            "id": "R-MONO",
            "name": "Monocacy 河",
            "name_en": "Monocacy River",
            "order": 2,
            "coords": [
                [-77.45, 39.65], [-77.40, 39.45], [-77.35, 39.25], [-77.30, 39.10],
                [-77.25, 39.05],
            ],
        },
        {
            "id": "R-ANAC",
            "name": "Anacostia 河",
            "name_en": "Anacostia River",
            "order": 3,
            "coords": [
                [-76.95, 38.95], [-77.00, 38.90], [-77.05, 38.88], [-77.10, 38.87],
            ],
        },
    ],
    "stations": [
        {
            "id": "01636500",
            "name": "Shenandoah River at Millville, WV",
            "name_zh": "Shenandoah 河 Millville 站",
            "lon": -77.7867,
            "lat": 39.2886,
            "role": "支流控制站",
            "agency": "USGS",
            "param": "日均流量",
            "q": 85,
            "stage": 2.35,
            "warn_stage": 3.2,
            "alert_stage": 3.8,
            "warn_q": 400,
            "alert_q": 800,
            "source": "USGS NWIS site id (coords approx.)",
            "note": "站码真实；水位/阈值为示意",
        },
        {
            "id": "01638480",
            "name": "Potomac River at Harpers Ferry, WV",
            "name_zh": "Potomac 河 Harpers Ferry 站",
            "lon": -77.7283,
            "lat": 39.3226,
            "role": "中游控制站",
            "agency": "USGS",
            "param": "日均流量",
            "q": 420,
            "stage": 3.05,
            "warn_stage": 3.2,
            "alert_stage": 3.9,
            "warn_q": 900,
            "alert_q": 1600,
            "source": "USGS NWIS site id (coords approx.)",
            "note": "站码真实；水位接近警戒（示意 near/warn）",
        },
        {
            "id": "01646500",
            "name": "Potomac River at Washington, DC",
            "name_zh": "Potomac 河 Washington 出口站",
            "lon": -77.1278,
            "lat": 38.9498,
            "role": "下游出口控制站",
            "agency": "USGS",
            "param": "日均流量",
            "q": 980,
            "stage": 2.1,
            "warn_stage": 3.5,
            "alert_stage": 4.2,
            "warn_q": 2000,
            "alert_q": 3500,
            "source": "USGS NWIS site id (coords approx.)",
            "note": "站码真实；水位/阈值为示意",
        },
        {
            "id": "01638500",
            "name": "Potomac River at Point of Rocks, MD",
            "name_zh": "Potomac 河 Point of Rocks 站",
            "lon": -77.5390,
            "lat": 39.2740,
            "role": "中游站",
            "agency": "USGS",
            "param": "日均流量",
            "q": 610,
            "stage": 4.15,
            "warn_stage": 3.4,
            "alert_stage": 4.0,
            "warn_q": 1200,
            "alert_q": 2200,
            "source": "USGS NWIS site id (coords approx.)",
            "note": "站码真实；示意超保证水位（alert）",
        },
        {
            "id": "01643000",
            "name": "Monocacy River at Bridgeport, MD",
            "name_zh": "Monocacy 河 Bridgeport 站",
            "lon": -77.2800,
            "lat": 39.3900,
            "role": "支流站",
            "agency": "USGS",
            "param": "日均流量",
            "q": 45,
            "stage": 1.55,
            "warn_stage": 2.8,
            "alert_stage": 3.4,
            "warn_q": 200,
            "alert_q": 450,
            "source": "USGS NWIS site id (coords approx.)",
            "note": "站码真实；水位/阈值为示意",
        },
    ],
    "reservoirs": [
        {
            "id": "RSV-JENNINGS",
            "name": "Jennings Randolph Lake",
            "name_zh": "Jennings Randolph 水库",
            "lon": -79.365,
            "lat": 39.428,
            "purpose": "防洪 / 供水",
            "capacity_e6m3": 158,
            "note": "库容量级示意，非工程设计值",
            "source": "public names + schematic capacity order-of-magnitude",
        },
        {
            "id": "RSV-BLOOM",
            "name": "Bloomington Lake",
            "name_zh": "Bloomington 水库",
            "lon": -79.210,
            "lat": 39.465,
            "purpose": "防洪",
            "capacity_e6m3": 92,
            "note": "库容量级示意，非工程设计值",
            "source": "public names + schematic capacity order-of-magnitude",
        },
        {
            "id": "RSV-SAVAGE",
            "name": "Savage River Reservoir",
            "name_zh": "Savage 河水库",
            "lon": -79.115,
            "lat": 39.505,
            "purpose": "补水 / 生态",
            "capacity_e6m3": 25,
            "note": "库容量级示意，非工程设计值",
            "source": "public names + schematic capacity order-of-magnitude",
        },
    ],
    "slope_bbox": (-79.45, -76.90, 38.40, 39.90),
}

POTOMAC_META = {
    "title": "波托马克河流域",
    "title_en": "Potomac River Basin",
    "region": "USA / Mid-Atlantic",
    "area_km2_nominal": 14670,
    "default": True,
    "center": [39.15, -77.75],
    "zoom": 8,
    "disclaimer": "教学示意数据（schematic）：边界与河网已简化；坡度为合成 DEM 示意，不可用于工程设计。",
    "lineage": {
        "basin": "手绘简化边界；名义面积参考公开文献量级",
        "subbasins": "按干/支流分区的示意多边形，非官方 HUC 边界",
        "rivers": "干流+主要支流示意折线；length_km 由折线估算",
        "stations": "USGS NWIS 站码；坐标近似，用于叠图",
        "reservoirs": "公开水库名称；库容为示意量级",
        "slope": "合成高程代理 → 坡度分级色块，非实测 DEM",
    },
}

# ----- Hanjiang above Danjiangkou (China schematic demo) -----
HANJIANG = {
    "basin": {
        "id": "BASIN-HANJIANG-SCH",
        "name": "汉江丹江口以上（示意）",
        "name_en": "Upper Hanjiang above Danjiangkou (schematic)",
        "area_km2": 95000,
        "outlet_id": "ST-DJK",
        "note": "中国示范流域示意几何；名义面积量级约 9.5×10⁴ km²，非官方精确划界",
        "source": "hand-digitized schematic for portfolio demo",
        "ring": [
            [106.2, 33.8], [107.5, 34.2], [109.0, 34.0], [110.5, 33.6],
            [111.5, 33.0], [111.8, 32.5], [111.2, 32.2], [110.0, 32.4],
            [108.5, 32.6], [107.2, 32.8], [106.4, 33.2], [106.2, 33.8],
        ],
    },
    "subbasins": [
        {
            "id": "SB-HJ-UP",
            "name": "汉源—石泉示意区",
            "name_en": "Hanyuan–Shiquan schematic zone",
            "area_km2": 28000,
            "note": "示意子区，非水利部正式分区",
            "ring": [
                [106.2, 33.8], [107.5, 34.2], [108.3, 33.7], [107.8, 33.0],
                [106.8, 33.0], [106.2, 33.4], [106.2, 33.8],
            ],
        },
        {
            "id": "SB-HJ-MID",
            "name": "安康—白河示意区",
            "name_en": "Ankang–Baihe schematic zone",
            "area_km2": 32000,
            "note": "示意子区，非水利部正式分区",
            "ring": [
                [108.0, 33.7], [109.5, 33.8], [110.2, 33.2], [109.5, 32.6],
                [108.2, 32.7], [107.9, 33.2], [108.0, 33.7],
            ],
        },
        {
            "id": "SB-HJ-DJK",
            "name": "丹江口以上近库示意区",
            "name_en": "Near-Danjiangkou schematic zone",
            "area_km2": 35000,
            "note": "示意子区，非水利部正式分区",
            "ring": [
                [109.8, 33.5], [111.5, 33.0], [111.8, 32.5], [111.0, 32.2],
                [109.8, 32.5], [109.5, 33.0], [109.8, 33.5],
            ],
        },
    ],
    "rivers": [
        {
            "id": "R-HJ-MAIN",
            "name": "汉江干流（示意）",
            "name_en": "Hanjiang main stem (schematic)",
            "order": 1,
            "coords": [
                [106.6, 33.5], [107.4, 33.3], [108.2, 32.95], [109.0, 32.8],
                [109.8, 32.7], [110.6, 32.6], [111.2, 32.55], [111.5, 32.45],
            ],
            "note": "示意干流折线",
        },
        {
            "id": "R-HJ-DU",
            "name": "堵河（示意）",
            "name_en": "Du River (schematic)",
            "order": 2,
            "coords": [
                [109.6, 33.4], [109.9, 33.1], [110.3, 32.85], [110.6, 32.6],
            ],
            "note": "示意支流折线",
        },
        {
            "id": "R-HJ-DAN",
            "name": "丹江（示意）",
            "name_en": "Dan River (schematic)",
            "order": 2,
            "coords": [
                [111.0, 33.3], [111.1, 32.95], [111.2, 32.7], [111.35, 32.5],
            ],
            "note": "示意支流折线",
        },
    ],
    "stations": [
        {
            "id": "ST-SQ",
            "name": "Shiquan schematic gauge",
            "name_zh": "石泉示意站",
            "lon": 108.25,
            "lat": 33.05,
            "role": "中游示意站",
            "agency": "schematic",
            "param": "流量（示意）",
            "q": 320,
            "stage": 245.2,
            "warn_stage": 248.0,
            "alert_stage": 250.5,
            "warn_q": 800,
            "alert_q": 1400,
            "note": "虚构示意站点；水位阈值为示意",
            "source": "portfolio schematic only",
        },
        {
            "id": "ST-AK",
            "name": "Ankang schematic gauge",
            "name_zh": "安康示意站",
            "lon": 109.05,
            "lat": 32.75,
            "role": "中游示意站",
            "agency": "schematic",
            "param": "流量（示意）",
            "q": 780,
            "stage": 247.6,
            "warn_stage": 248.0,
            "alert_stage": 251.0,
            "warn_q": 1500,
            "alert_q": 2800,
            "note": "虚构示意站点；接近警戒（示意）",
            "source": "portfolio schematic only",
        },
        {
            "id": "ST-DJK",
            "name": "Danjiangkou schematic outlet",
            "name_zh": "丹江口近库示意站",
            "lon": 111.45,
            "lat": 32.55,
            "role": "出口示意站",
            "agency": "schematic",
            "param": "流量（示意）",
            "q": 1100,
            "stage": 152.0,
            "warn_stage": 157.0,
            "alert_stage": 160.0,
            "warn_q": 3000,
            "alert_q": 5000,
            "note": "虚构示意站点；水位阈值为示意",
            "source": "portfolio schematic only",
        },
    ],
    "reservoirs": [
        {
            "id": "RSV-AK",
            "name": "Ankang Reservoir (schematic point)",
            "name_zh": "安康水库（示意点）",
            "lon": 108.95,
            "lat": 32.72,
            "purpose": "发电 / 防洪（示意）",
            "capacity_e6m3": 2580,
            "note": "位置与库容均为示意量级",
            "source": "public name + schematic magnitude",
        },
        {
            "id": "RSV-DJK",
            "name": "Danjiangkou Reservoir (schematic point)",
            "name_zh": "丹江口水库（示意点）",
            "lon": 111.48,
            "lat": 32.72,
            "purpose": "供水 / 防洪（示意）",
            "capacity_e6m3": 29000,
            "note": "位置与库容均为示意量级；非工程设计值",
            "source": "public name + schematic magnitude",
        },
    ],
    "slope_bbox": (106.2, 111.8, 32.2, 34.2),
}

HANJIANG_META = {
    "title": "汉江丹江口以上（示意）",
    "title_en": "Upper Hanjiang schematic",
    "region": "China / 汉江上游",
    "area_km2_nominal": 95000,
    "default": False,
    "center": [33.0, 109.0],
    "zoom": 7,
    "disclaimer": "中国示范流域为手绘示意（schematic=true）：站网与库容非实测产品，仅供国内语境讲解数据谱系与交互。",
    "lineage": {
        "basin": "手绘示意边界；名义面积为公开量级，非官方矢量",
        "subbasins": "教学分区示意多边形",
        "rivers": "干流+堵河/丹江示意折线",
        "stations": "虚构示意站（非水文年鉴站网）",
        "reservoirs": "公开水库名 + 示意库容量级",
        "slope": "合成 DEM 代理色块，非实测",
    },
}


SCHEMA = {
    "title": "Watershed GeoJSON property dictionary / 属性字典",
    "epsg": 4326,
    "coordinate_order": "[lon, lat]",
    "schematic_policy": "Any feature with schematic=true is educational geometry or attributes; never treat as survey-grade.",
    "fields": [
        {"key": "id", "zh": "编码", "en": "Feature id", "required": True},
        {"key": "name", "zh": "名称", "en": "Display name (prefer zh)", "required": True},
        {"key": "name_en", "zh": "英文名", "en": "English name", "required": False},
        {"key": "type", "zh": "类型", "en": "basin|subbasin|river|station|reservoir|slope_cell", "required": True},
        {"key": "schematic", "zh": "是否示意", "en": "Always true for demo layers", "required": True},
        {"key": "area_km2", "zh": "面积(km²)", "en": "Area km²", "applies_to": ["basin", "subbasin"]},
        {"key": "length_km", "zh": "长度(km)", "en": "Polyline length km", "applies_to": ["river"]},
        {"key": "stream_order", "zh": "河序", "en": "Stream order (schematic)", "applies_to": ["river"]},
        {"key": "outlet_id", "zh": "出口站码", "en": "Outlet station id", "applies_to": ["basin"]},
        {"key": "role", "zh": "站网角色", "en": "Station role", "applies_to": ["station"]},
        {"key": "agency", "zh": "管理机构", "en": "Agency", "applies_to": ["station"]},
        {"key": "param", "zh": "观测参数", "en": "Observed parameter", "applies_to": ["station"]},
        {"key": "q", "zh": "流量示意", "en": "Discharge schematic", "applies_to": ["station"]},
        {"key": "stage", "zh": "水位示意(m)", "en": "Stage schematic m", "applies_to": ["station"]},
        {"key": "warn_stage", "zh": "警戒水位(m)", "en": "Warning stage m", "applies_to": ["station"]},
        {"key": "alert_stage", "zh": "保证水位(m)", "en": "Alert stage m", "applies_to": ["station"]},
        {"key": "status", "zh": "阈值状态", "en": "normal|near|warn|alert", "applies_to": ["station"]},
        {"key": "dist_to_river_km", "zh": "距河道(km)", "en": "Distance to river km", "applies_to": ["station"]},
        {"key": "series", "zh": "过程线路径", "en": "Relative series JSON path", "applies_to": ["station"]},
        {"key": "purpose", "zh": "水库用途", "en": "Reservoir purpose", "applies_to": ["reservoir"]},
        {"key": "capacity_e6m3", "zh": "库容(10⁶m³)", "en": "Capacity 10⁶ m³ (schematic)", "applies_to": ["reservoir"]},
        {"key": "slope_class", "zh": "坡度级", "en": "Slope class 1–3", "applies_to": ["slope_cell"]},
        {"key": "slope_label", "zh": "坡度标签", "en": "Slope label", "applies_to": ["slope_cell"]},
        {"key": "elev_proxy_m", "zh": "高程代理(m)", "en": "Synthetic elev proxy m", "applies_to": ["slope_cell"]},
        {"key": "source", "zh": "来源说明", "en": "Provenance note", "required": False},
        {"key": "note", "zh": "备注", "en": "Caveat / note", "required": False},
    ],
}


def sync_public() -> None:
    """Copy canonical data/geojson → public/watershed-map (compact JSON for runtime)."""
    if PUBLIC.exists():
        # Keep screenshots out of public; replace published payload only
        for child in list(PUBLIC.iterdir()):
            if child.name in ("screenshots",):
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    PUBLIC.mkdir(parents=True, exist_ok=True)

    def copy_tree(src: Path, dst: Path) -> None:
        dst.mkdir(parents=True, exist_ok=True)
        for path in src.rglob("*"):
            rel = path.relative_to(src)
            target = dst / rel
            if path.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            if path.suffix == ".json" or path.suffix == ".geojson":
                obj = json.loads(path.read_text(encoding="utf-8"))
                target.write_text(
                    json.dumps(obj, ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, target)

    copy_tree(DATA, PUBLIC)
    LEGACY.mkdir(parents=True, exist_ok=True)
    for name in [
        "basin.geojson",
        "subbasins.geojson",
        "rivers.geojson",
        "stations.geojson",
        "reservoirs.geojson",
        "slope-hint.geojson",
        "manifest.json",
    ]:
        src = BASINS / "potomac" / name
        if src.exists():
            obj = json.loads(src.read_text(encoding="utf-8"))
            (LEGACY / name).write_text(
                json.dumps(obj, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
    print(f"synced → {PUBLIC}")


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    write_basin("potomac", POTOMAC_META, POTOMAC)
    write_basin("hanjiang-schematic", HANJIANG_META, HANJIANG)

    catalog = {
        "default": "potomac",
        "basins": [
            {
                "id": "potomac",
                "title": POTOMAC_META["title"],
                "title_en": POTOMAC_META["title_en"],
                "region": POTOMAC_META["region"],
                "schematic": True,
                "path": "basins/potomac",
            },
            {
                "id": "hanjiang-schematic",
                "title": HANJIANG_META["title"],
                "title_en": HANJIANG_META["title_en"],
                "region": HANJIANG_META["region"],
                "schematic": True,
                "path": "basins/hanjiang-schematic",
            },
        ],
    }
    (DATA / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "schema.json").write_text(json.dumps(SCHEMA, ensure_ascii=False, indent=2), encoding="utf-8")
    sync_public()
    print("done", DATA, "→", PUBLIC)


if __name__ == "__main__":
    main()
