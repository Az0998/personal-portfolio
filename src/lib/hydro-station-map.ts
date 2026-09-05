/**
 * Map watershed-map station IDs → HydroInfo overview station IDs for demo jumps.
 * Unmapped IDs fall back to first HydroInfo station / YR-HYK.
 */
export const WATERSHED_TO_HYDRO_STATION: Record<string, string> = {
  // Potomac USGS → Yellow River demo set (schematic pairing for interview demo)
  "01646500": "YR-HYK",
  "01638500": "YR-TG",
  "01636500": "YR-TDG",
  "01648010": "YR-LJ",
  // Hanjiang schematic
  "ST-HK": "YR-HYK",
  "ST-XY": "TAO-LT",
  "ST-YZ": "YR-TG",
  "ST-JZ": "YR-LZ",
};

export function resolveHydroStationId(
  raw: string | null | undefined,
  availableIds?: string[],
): string {
  if (!raw) return availableIds?.[0] || "YR-HYK";
  const mapped = WATERSHED_TO_HYDRO_STATION[raw] || raw;
  if (availableIds?.length) {
    if (availableIds.includes(mapped)) return mapped;
    if (availableIds.includes(raw)) return raw;
    return availableIds[0];
  }
  return mapped;
}

export function hydroInfoHref(stationId: string | null | undefined, hubBase = "/hydrobench") {
  const id = resolveHydroStationId(stationId);
  const base = hubBase.includes("?") ? hubBase : `${hubBase}?tab=info`;
  const u = new URL(base, "http://local");
  u.searchParams.set("tab", "info");
  u.searchParams.set("station", id);
  return `${u.pathname}?${u.searchParams.toString()}`;
}
