import type { DemandRow, WaterBalanceInput, WaterBalanceResult } from "./types";

export const DEFAULT_DEMANDS: DemandRow[] = [
  { id: "life", name: "生活用水", volume: 12, note: "厂区及配套生活" },
  { id: "ind", name: "工业用水", volume: 86, note: "集中区主要需水" },
  { id: "irr", name: "灌溉用水", volume: 10, note: "绿化及少量农灌" },
  { id: "eco", name: "生态用水", volume: 4, note: "河道内生态补水示意" },
  { id: "other", name: "其他用水", volume: 0, note: "" },
];

export const SAMPLE_INPUT: WaterBalanceInput = {
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
  demands: DEFAULT_DEMANDS.map((d) => ({ ...d })),
};

export function emptyInput(): WaterBalanceInput {
  return {
    ...SAMPLE_INPUT,
    projectName: "",
    location: "",
    owner: "",
    industry: "",
    sourceName: "",
    withdrawal: 0,
    returnWater: 0,
    loss: 0,
    demands: DEFAULT_DEMANDS.map((d) => ({ ...d, volume: 0, note: "" })),
  };
}

export function computeBalance(input: WaterBalanceInput): WaterBalanceResult {
  const demandTotal = input.demands.reduce((s, d) => s + (Number(d.volume) || 0), 0);
  const Q = Number(input.withdrawal) || 0;
  const R = Number(input.returnWater) || 0;
  const L = Number(input.loss) || 0;
  const consume = Q - R;
  const residual = Q - demandTotal - L;
  const closed = Math.abs(residual) <= 0.05 * Math.max(Q, 1) || Math.abs(residual) < 0.2;
  const flags: string[] = [];

  if (Q <= 0) flags.push("取水量未填写，报告仅能给出结构示意。");
  if (R < 0 || L < 0) flags.push("退水或损耗为负，请检查输入。");
  if (R > Q && Q > 0) flags.push("退水量大于取水量，水平衡不闭合。");
  if (!closed && Q > 0) {
    flags.push(
      residual > 0
        ? "取水大于「需水合计 + 损耗」，存在未分解余量，论证稿中应说明未预见损失或预留。"
        : "需水合计与损耗超过取水，存在缺口，应复核定额、节水或增补水源。"
    );
  }
  if (input.industry.includes("工业") && input.reliability < 90) {
    flags.push("工业/集中供水常见论证口径多为 90%～95% 保证率，当前取值偏低，请核对水源类型。");
  }
  if (input.industry.includes("灌溉") && input.reliability > 90) {
    flags.push("灌溉工程常见保证率多为 75%～90%，95% 偏高，请按灌区规范核对。");
  }

  return {
    demandTotal: round(demandTotal),
    consume: round(consume),
    returnRate: Q > 0 ? round((R / Q) * 100) : 0,
    consumeRate: Q > 0 ? round((consume / Q) * 100) : 0,
    lossRate: Q > 0 ? round((L / Q) * 100) : 0,
    residual: round(residual),
    closed,
    flags,
  };
}

export function recommendReliability(industry: string): string {
  if (industry.includes("灌溉") || industry.includes("农业")) return "农业灌溉用水保证率常见 75%～90%。";
  if (industry.includes("生活") || industry.includes("城镇")) return "城镇生活供水保证率常见 95%。";
  return "工业及综合供水保证率常见 90%～95%。";
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
