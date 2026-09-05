import { CASES } from "./cases";
import type {
  BalanceStatus,
  DemandRow,
  VolumeUnit,
  WaterBalanceInput,
  WaterBalanceResult,
} from "./types";

/** 年日换算固定 365 日，与论证常见简化年一致；不是闰年加权。 */
export const DAYS_PER_YEAR = 365;
export const WAN_M3 = 10_000;
/** 显示到 0.01 时，小于半个最小读数视为 0 */
export const DISPLAY_EPS = 0.005;

export const UNIT_LABEL: Record<VolumeUnit, string> = {
  "万m³/a": "万m³/a",
  "m³/d": "m³/d",
};

export function cloneInput(input: WaterBalanceInput): WaterBalanceInput {
  return {
    ...input,
    demands: input.demands.map((d) => ({ ...d })),
  };
}

export const DEFAULT_DEMANDS: DemandRow[] = [
  { id: "life", name: "生活用水", volume: 12, note: "厂区及配套生活" },
  { id: "ind", name: "工业用水", volume: 86, note: "集中区主要需水" },
  { id: "irr", name: "灌溉用水", volume: 10, note: "绿化及少量农灌" },
  { id: "eco", name: "生态用水", volume: 4, note: "河道内生态补水示意" },
  { id: "other", name: "其他用水", volume: 0, note: "" },
];

export function sampleInput(): WaterBalanceInput {
  return cloneInput(CASES[0].input);
}

export function emptyInput(): WaterBalanceInput {
  return {
    projectName: "",
    location: "",
    owner: "",
    industry: "",
    year: 2026,
    horizonYear: 2030,
    sourceName: "",
    sourceType: "地表水",
    reliability: null,
    unit: "万m³/a",
    withdrawal: 0,
    returnWater: 0,
    loss: 0,
    demands: DEFAULT_DEMANDS.map((d) => ({ ...d, volume: 0, note: "" })),
  };
}

export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  if (from === to) return value;
  if (from === "万m³/a" && to === "m³/d") return (value * WAN_M3) / DAYS_PER_YEAR;
  return (value * DAYS_PER_YEAR) / WAN_M3;
}

export function convertInputUnit(input: WaterBalanceInput, to: VolumeUnit): WaterBalanceInput {
  const from = input.unit;
  if (from === to) return cloneInput(input);
  const x = (n: number) => round(convertVolume(Number(n) || 0, from, to));
  return {
    ...cloneInput(input),
    unit: to,
    withdrawal: x(input.withdrawal),
    returnWater: x(input.returnWater),
    loss: x(input.loss),
    demands: input.demands.map((d) => ({ ...d, volume: x(d.volume) })),
  };
}

export function sumDemands(demands: DemandRow[]): number {
  return round(demands.reduce((s, d) => s + (Number(d.volume) || 0), 0));
}

/** 独立加总，供表内校验对照「需水合计」。按定义应与 sumDemands 同值。 */
export function checksumDemands(demands: DemandRow[]): number {
  let s = 0;
  for (const d of demands) s += Number(d.volume) || 0;
  return round(s);
}

export function computeBalance(input: WaterBalanceInput): WaterBalanceResult {
  const demandTotal = sumDemands(input.demands);
  const demandChecksum = checksumDemands(input.demands);
  const demandGap = round(demandChecksum - demandTotal);
  const Q = Number(input.withdrawal) || 0;
  const R = Number(input.returnWater) || 0;
  const L = Number(input.loss) || 0;
  const consume = round(Q - R);
  const residual = round(Q - (demandTotal + L));
  const nearZero = Math.abs(residual) < DISPLAY_EPS;
  const idle =
    Math.abs(Q) < DISPLAY_EPS && Math.abs(demandTotal) < DISPLAY_EPS && Math.abs(L) < DISPLAY_EPS;
  const status: BalanceStatus = idle ? "idle" : nearZero ? "closed" : "open";
  const closed = status === "closed";
  const flags: string[] = [];

  if (Math.abs(demandGap) >= DISPLAY_EPS) {
    flags.push(
      `需水表内校验超差 ${fmtSigned(demandGap)} ${input.unit}：分项之和与需水合计不一致。`
    );
  }
  if (status === "idle") flags.push("尚未填写取水或需水，右侧为结构示意，不作闭合判断。");
  if (R < 0 || L < 0) flags.push("退水或管网/未计量损失为负，请检查输入。");
  if (R > Q + DISPLAY_EPS && Q > 0) flags.push("退水大于取水，耗水为负，主口径下不平衡。");
  if (status === "open") {
    flags.push(
      residual > 0
        ? `平衡差 ${fmtSigned(residual)} ${input.unit}：取水大于「需水合计 + 损失」，有未分解余量。`
        : `平衡差 ${fmtSigned(residual)} ${input.unit}：需水合计与损失超过取水，存在缺口。`
    );
  }

  if (input.industry.includes("工业") && input.reliability < 90) {
    flags.push("工业/集中供水常见论证口径多为 90%～95% 保证率，当前取值偏低。");
  }
  if (input.industry.includes("灌溉") && input.reliability > 90) {
    flags.push("灌溉工程常见保证率多为 75%～90%，95% 偏高，请按灌区规范核对。");
  }

  return {
    demandTotal,
    demandChecksum,
    demandGap,
    consume,
    returnRate: Q > 0 ? round((R / Q) * 100) : 0,
    consumeRate: Q > 0 ? round((consume / Q) * 100) : 0,
    lossRate: Q > 0 ? round((L / Q) * 100) : 0,
    residual,
    closed,
    status,
    flags,
    formulas: {
      demand: "D = Σ 分项需水",
      consume: "C = Q − R（取水 − 退水；本工具唯一耗水口径）",
      residual: "Δ = Q − (D + L)，|Δ| < 0.005 才可称闭合",
    },
  };
}

export function recommendReliability(industry: string): string {
  if (industry.includes("灌溉") || industry.includes("农业")) return "农业灌溉用水保证率常见 75%～90%。";
  if (industry.includes("生活") || industry.includes("城镇")) return "城镇生活供水保证率常见 95%。";
  return "工业及综合供水保证率常见 90%～95%。";
}

export function newDemandRow(): DemandRow {
  return { id: "d-" + Math.random().toString(36).slice(2, 8), name: "新用水户", volume: 0, note: "" };
}

export function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmtSigned(n: number) {
  if (Math.abs(n) < DISPLAY_EPS) return "0";
  return n > 0 ? `+${round(n)}` : `${round(n)}`;
}
