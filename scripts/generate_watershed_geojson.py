# -*- coding: utf-8 -*-
"""Generate simplified Potomac watershed GeoJSON layers for /watershed-map demo."""
from __future__ import annotations

import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "watershed-map" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def dump(name: str, fc: dict) -> None:
    path = OUT / name
    path.write_text(json.dumps(fc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {path} ({len(fc.get('features', []))} features)")


# Approximate Potomac basin outline (simplified educational geometry)
BASIN_RING = [
    [-79.48, 39.72], [-78.95, 39.95], [-78.20, 39.88], [-77.55, 39.70],
    [-77.05, 39.35], [-76.85, 38.95], [-76.95, 38.55], [-77.25, 38.35],
    [-77.85, 38.45], [-78.55, 38.70], [-79.15, 39.05], [-79.48, 39.45],
    [-79.48, 39.72],
]

SUBBASINS = [
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
]

# Main stem + major tributaries (simplified polylines, lon/lat)
RIVERS = [
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
]

STATIONS = [
    {
        "id": "01636500",
        "name": "Shenandoah River at Millville, WV",
        "name_zh": "Shenandoah 河 Millville 站",
        "lon": -77.7867,
        "lat": 39.2886,
        "role": "支流控制站",
        "agency": "USGS",
        "param": "日均流量",
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
    },
]

RESERVOIRS = [
    {
        "id": "RSV-JENNINGS",
        "name": "Jennings Randolph Lake",
        "name_zh": "Jennings Randolph 水库",
        "lon": -79.365,
        "lat": 39.428,
        "purpose": "防洪 / 供水",
        "capacity_e6m3": 158,
    },
    {
        "id": "RSV-BLOOM",
        "name": "Bloomington Lake",
        "name_zh": "Bloomington 水库",
        "lon": -79.210,
        "lat": 39.465,
        "purpose": "防洪",
        "capacity_e6m3": 92,
    },
    {
        "id": "RSV-SAVAGE",
        "name": "Savage River Reservoir",
        "name_zh": "Savage 河水库",
        "lon": -79.115,
        "lat": 39.505,
        "purpose": "补水 / 生态",
        "capacity_e6m3": 25,
    },
]


def haversine_km(lon1, lat1, lon2, lat2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def point_to_segment_km(px, py, ax, ay, bx, by):
    # Approximate local equirectangular for short segments
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


def dist_to_rivers_km(lon, lat):
    best = 1e9
    for riv in RIVERS:
        coords = riv["coords"]
        for i in range(len(coords) - 1):
            a, b = coords[i], coords[i + 1]
            d = point_to_segment_km(lon, lat, a[0], a[1], b[0], b[1])
            best = min(best, d)
    return round(best, 2)


def main():
    dump(
        "basin.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_basin",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": "BASIN-POTOMAC",
                        "name": "波托马克河流域",
                        "name_en": "Potomac River Basin",
                        "area_km2": 14670,
                        "outlet": "01646500",
                        "note": "教育示意边界，非官方精确划界",
                    },
                    "geometry": {"type": "Polygon", "coordinates": [BASIN_RING]},
                }
            ],
        },
    )

    dump(
        "subbasins.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_subbasins",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": sb["id"],
                        "name": sb["name"],
                        "name_en": sb["name_en"],
                        "area_km2": sb["area_km2"],
                    },
                    "geometry": {"type": "Polygon", "coordinates": [sb["ring"]]},
                }
                for sb in SUBBASINS
            ],
        },
    )

    dump(
        "rivers.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_rivers",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": r["id"],
                        "name": r["name"],
                        "name_en": r["name_en"],
                        "stream_order": r["order"],
                    },
                    "geometry": {"type": "LineString", "coordinates": r["coords"]},
                }
                for r in RIVERS
            ],
        },
    )

    station_features = []
    for s in STATIONS:
        d = dist_to_rivers_km(s["lon"], s["lat"])
        station_features.append(
            {
                "type": "Feature",
                "properties": {
                    **{k: v for k, v in s.items() if k not in ("lon", "lat")},
                    "dist_to_river_km": d,
                },
                "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
            }
        )
    dump(
        "stations.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_stations",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": station_features,
        },
    )

    dump(
        "reservoirs.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_reservoirs",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": r["id"],
                        "name": r["name"],
                        "name_zh": r["name_zh"],
                        "purpose": r["purpose"],
                        "capacity_e6m3": r["capacity_e6m3"],
                    },
                    "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
                }
                for r in RESERVOIRS
            ],
        },
    )

    # Coarse slope hint grid (synthetic from a simple DEM-like surface)
    # Higher elevation toward NW mountains → steeper near escarpment
    cells = []
    lon0, lon1 = -79.45, -76.90
    lat0, lat1 = 38.40, 39.90
    n = 12
    for i in range(n):
        for j in range(n):
            a = lon0 + (lon1 - lon0) * i / n
            b = lon0 + (lon1 - lon0) * (i + 1) / n
            c = lat0 + (lat1 - lat0) * j / n
            d = lat0 + (lat1 - lat0) * (j + 1) / n
            cx, cy = (a + b) / 2, (c + d) / 2
            # Synthetic elevation proxy & slope class
            elev = (39.9 - cy) * 180 + (-76.9 - cx) * 40
            slope = abs((-cx) * 0.8 + (cy - 39.0) * 2.2) + (1 if cx < -78.5 else 0.2)
            if slope < 1.2:
                cls, label = 1, "缓坡 (<5° 示意)"
            elif slope < 2.2:
                cls, label = 2, "中坡 (5–15° 示意)"
            else:
                cls, label = 3, "陡坡 (>15° 示意)"
            # Only keep cells roughly inside basin bbox
            if not (-79.5 < cx < -76.8 and 38.3 < cy < 40.0):
                continue
            cells.append(
                {
                    "type": "Feature",
                    "properties": {
                        "slope_class": cls,
                        "slope_label": label,
                        "elev_proxy_m": round(max(20, elev), 0),
                        "note": "DEM 派生示意，非实测精度",
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[a, c], [b, c], [b, d], [a, d], [a, c]]],
                    },
                }
            )
    dump(
        "slope-hint.geojson",
        {
            "type": "FeatureCollection",
            "name": "potomac_slope_hint",
            "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
            "features": cells,
        },
    )

    meta = {
        "basin": "Potomac River Basin / 波托马克河流域",
        "epsg": 4326,
        "area_km2_nominal": 14670,
        "layers": [
            "basin.geojson",
            "subbasins.geojson",
            "rivers.geojson",
            "stations.geojson",
            "reservoirs.geojson",
            "slope-hint.geojson",
        ],
        "disclaimer": "教学示意数据：边界与河网已简化；坡度为合成 DEM 示意，不可用于工程设计。",
        "stations_source": "USGS NWIS site coordinates (approx.)",
    }
    (OUT / "manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("done", OUT)


if __name__ == "__main__":
    main()
