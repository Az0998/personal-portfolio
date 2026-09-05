/** Unified watershed GeoJSON property dictionary (CN/EN). Missing → "—". */

export type PropField = {
  key: string;
  zh: string;
  en: string;
  /** If set, only show for these feature types */
  types?: string[];
};

export const WATERSHED_PROP_FIELDS: PropField[] = [
  { key: "id", zh: "编码", en: "id" },
  { key: "name", zh: "名称", en: "name" },
  { key: "name_en", zh: "英文名", en: "name_en" },
  { key: "type", zh: "类型", en: "type" },
  { key: "schematic", zh: "示意数据", en: "schematic" },
  { key: "area_km2", zh: "面积 (km²)", en: "area_km2", types: ["basin", "subbasin"] },
  { key: "length_km", zh: "长度 (km)", en: "length_km", types: ["river"] },
  { key: "stream_order", zh: "河序", en: "stream_order", types: ["river"] },
  { key: "outlet_id", zh: "出口站码", en: "outlet_id", types: ["basin"] },
  { key: "role", zh: "站网角色", en: "role", types: ["station"] },
  { key: "agency", zh: "管理机构", en: "agency", types: ["station"] },
  { key: "param", zh: "观测参数", en: "param", types: ["station"] },
  { key: "q", zh: "流量示意", en: "q", types: ["station"] },
  { key: "stage", zh: "水位示意 (m)", en: "stage", types: ["station"] },
  { key: "warn_stage", zh: "警戒水位 (m)", en: "warn_stage", types: ["station"] },
  { key: "alert_stage", zh: "保证水位 (m)", en: "alert_stage", types: ["station"] },
  { key: "status", zh: "阈值状态", en: "status", types: ["station"] },
  { key: "dist_to_river_km", zh: "距河道 (km)", en: "dist_to_river_km", types: ["station"] },
  { key: "series", zh: "过程线", en: "series", types: ["station"] },
  { key: "purpose", zh: "水库用途", en: "purpose", types: ["reservoir"] },
  { key: "capacity_e6m3", zh: "库容 (10⁶ m³)", en: "capacity_e6m3", types: ["reservoir"] },
  { key: "slope_class", zh: "坡度级", en: "slope_class", types: ["slope_cell"] },
  { key: "slope_label", zh: "坡度标签", en: "slope_label", types: ["slope_cell"] },
  { key: "elev_proxy_m", zh: "高程代理 (m)", en: "elev_proxy_m", types: ["slope_cell"] },
  { key: "source", zh: "来源", en: "source" },
  { key: "note", zh: "备注", en: "note" },
];

export type BasinManifest = {
  id: string;
  title: string;
  title_en?: string;
  region?: string;
  epsg: number;
  schematic: boolean;
  area_km2_nominal?: number;
  center?: [number, number];
  zoom?: number;
  disclaimer: string;
  lineage: Record<string, string>;
  layers: string[];
  property_schema?: string;
};

export type BasinCatalogItem = {
  id: string;
  title: string;
  title_en?: string;
  region?: string;
  schematic: boolean;
  path: string;
};

export type BasinCatalog = {
  default: string;
  basins: BasinCatalogItem[];
};

const TYPE_ZH: Record<string, string> = {
  basin: "流域",
  subbasin: "子流域",
  river: "河道",
  station: "水文站",
  reservoir: "水库",
  slope_cell: "坡度示意单元",
};

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "是 (schematic)" : "否";
  return String(value);
}

export function featureTypeOf(props: Record<string, unknown> | null | undefined): string {
  const t = props?.type;
  if (typeof t === "string" && t) return t;
  return "feature";
}

export function featureTitle(props: Record<string, unknown> | null | undefined): string {
  const p = props || {};
  return display(p.name || p.name_zh || p.name_en || p.slope_label || p.id);
}

export function featureDetailRows(props: Record<string, unknown> | null | undefined) {
  const p = props || {};
  const t = featureTypeOf(p);
  const rows: { label: string; en: string; value: string }[] = [];
  for (const field of WATERSHED_PROP_FIELDS) {
    if (field.types && !field.types.includes(t)) continue;
    const raw = p[field.key];
    if (field.key === "type") {
      rows.push({ label: field.zh, en: field.en, value: TYPE_ZH[t] || display(raw) });
      continue;
    }
    if (field.key === "dist_to_river_km" && typeof raw === "number") {
      rows.push({
        label: field.zh,
        en: field.en,
        value: raw < 1 ? `${Math.round(raw * 1000)} m` : `${raw} km`,
      });
      continue;
    }
    rows.push({ label: field.zh, en: field.en, value: display(raw) });
  }
  return rows;
}

export function typeLabelZh(type: string) {
  return TYPE_ZH[type] || type;
}
