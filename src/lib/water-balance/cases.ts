import type { WaterBalanceInput } from "./types";

export type CaseItem = {
  id: string;
  title: string;
  blurb: string;
  input: WaterBalanceInput;
};

export const CASES: CaseItem[] = [
  {
    id: "industrial-park",
    title: "工业集中区供水",
    blurb: "临洮集中区 · 地表水 · 95% · Δ=0",
    input: {
      projectName: "临洮工业集中区供水工程",
      location: "甘肃省定西市临洮县",
      owner: "临洮县水务局（演示）",
      industry: "工业集中区综合供水",
      year: 2026,
      horizonYear: 2030,
      sourceName: "洮河",
      sourceType: "地表水",
      reliability: 95,
      unit: "万m³/a",
      withdrawal: 120,
      returnWater: 48,
      loss: 8,
      demands: [
        { id: "life", name: "生活用水", volume: 12, note: "厂区及配套生活" },
        { id: "ind", name: "工业用水", volume: 86, note: "集中区主要需水" },
        { id: "irr", name: "灌溉用水", volume: 10, note: "绿化及少量农灌" },
        { id: "eco", name: "生态用水", volume: 4, note: "河道内生态补水示意" },
        { id: "other", name: "其他用水", volume: 0, note: "" },
      ],
    },
  },
  {
    id: "urban-supply",
    title: "城镇供水",
    blurb: "县城水厂 · 生活为主 · 95% · Δ=0",
    input: {
      projectName: "临洮县城第二水厂供水工程",
      location: "甘肃省定西市临洮县",
      owner: "临洮县城乡供水保障中心（演示）",
      industry: "城镇生活供水",
      year: 2026,
      horizonYear: 2035,
      sourceName: "洮河及县城水源地",
      sourceType: "地表水",
      reliability: 95,
      unit: "万m³/a",
      withdrawal: 86,
      returnWater: 52,
      loss: 6,
      demands: [
        { id: "life", name: "居民生活用水", volume: 58, note: "县城建成区生活" },
        { id: "pub", name: "公共及服务业", volume: 10, note: "机关、学校、商服" },
        { id: "ind", name: "一般工业用水", volume: 8, note: "城区配套工业" },
        { id: "eco", name: "环境卫生用水", volume: 4, note: "绿化浇洒示意" },
        { id: "other", name: "其他用水", volume: 0, note: "" },
      ],
    },
  },
];

export function caseById(id: string): CaseItem | undefined {
  return CASES.find((c) => c.id === id);
}
