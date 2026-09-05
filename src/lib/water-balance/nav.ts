export type IndoorNavLinks = {
  hydroInfo: string;
  hydroBench: string;
  watershedMap: string;
};

export const DEFAULT_INDOOR_NAV: IndoorNavLinks = {
  hydroInfo: "/hydrobench?tab=info",
  hydroBench: "/hydrobench",
  watershedMap: "/watershed-map",
};

export function indoorNavFromEnv(): IndoorNavLinks {
  return {
    hydroInfo: process.env.NEXT_PUBLIC_HYDRO_INFO_URL?.trim() || DEFAULT_INDOOR_NAV.hydroInfo,
    hydroBench: process.env.NEXT_PUBLIC_HYDRO_HUB_URL?.trim() || DEFAULT_INDOOR_NAV.hydroBench,
    watershedMap:
      process.env.NEXT_PUBLIC_WATERSHED_MAP_URL?.trim() || DEFAULT_INDOOR_NAV.watershedMap,
  };
}

export const WORK_BLURB =
  "信息化交付里的业务文档自动化：填取用水与需水结构，生成水平衡与论证草稿，软硬质控后导出 Word / Markdown，便于室内岗交付与作品集附送。";

export const WORK_TAGS = ["水平衡", "论证草稿", "Word/Markdown", "质控校验"] as const;
