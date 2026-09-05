/**
 * Zero-key basemap presets for Leaflet demos.
 *
 * Default: Esri World Dark/Light Gray Canvas (no API key).
 * Optional override (do NOT commit keys):
 *   NEXT_PUBLIC_MAP_TILE_URL
 *   NEXT_PUBLIC_MAP_TILE_ATTR
 *   NEXT_PUBLIC_MAP_TILE_SUBDOMAINS  (e.g. abcd)
 *
 * Examples (env only):
 *   Carto Dark Matter (needs key on new Carto accounts):
 *     NEXT_PUBLIC_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
 *   Mapbox:
 *     NEXT_PUBLIC_MAP_TILE_URL=https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=YOUR_TOKEN
 */

export type BasemapOptions = {
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string | string[];
  className?: string;
};

const OSM: BasemapOptions = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
};

/** Esri World Dark Gray Base — zero key, dark UI friendly. Note {z}/{y}/{x} order. */
const ESRI_DARK_GRAY: BasemapOptions = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  attribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin',
  maxZoom: 16,
};

const ESRI_LIGHT_GRAY: BasemapOptions = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  attribution:
    'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin',
  maxZoom: 16,
};

/** OSM + CSS invert (className) when Esri is blocked; still zero key. */
const OSM_DARK_CSS: BasemapOptions = {
  ...OSM,
  className: "wm-basemap-dark",
};

function fromEnv(): BasemapOptions | null {
  const url = process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim();
  if (!url) return null;
  const sub = process.env.NEXT_PUBLIC_MAP_TILE_SUBDOMAINS?.trim();
  return {
    url,
    attribution:
      process.env.NEXT_PUBLIC_MAP_TILE_ATTR?.trim() ||
      "© Map tiles (custom)",
    maxZoom: 19,
    ...(sub ? { subdomains: sub } : {}),
  };
}

export type BasemapPreset = "dark" | "light" | "osm" | "osm-dark";

/** Resolve basemap: env override → zero-key preset. Never hardcode Carto/Mapbox keys. */
export function resolveBasemap(preset: BasemapPreset = "dark"): BasemapOptions {
  const custom = fromEnv();
  if (custom) return custom;

  switch (preset) {
    case "light":
      return ESRI_LIGHT_GRAY;
    case "osm":
      return OSM;
    case "osm-dark":
      return OSM_DARK_CSS;
    case "dark":
    default:
      return ESRI_DARK_GRAY;
  }
}
