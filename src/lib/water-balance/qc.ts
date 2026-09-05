import { DAYS_PER_YEAR, DISPLAY_EPS, WAN_M3, round } from "./compute";
import rulesConfig from "./rules.json";
import type { QcFinding, QcLevel, QcReport, WaterBalanceInput, WaterBalanceResult } from "./types";

type RuleDef = {
  id: string;
  level: QcLevel;
  enabled: boolean;
  name: string;
  advice: string;
};

type RulesFile = {
  version: number;
  thresholds: {
    residualAbsHardWan: number;
    lifeShareMinPct: number;
    lifeShareMaxPct: number;
    returnRateMinPct: number;
    returnRateMaxPct: number;
  };
  keywords: {
    industrial: string[];
    lifeDemand: string[];
    highConsume: string[];
  };
  rules: RuleDef[];
};

const CONFIG = rulesConfig as RulesFile;

export function residualHardThreshold(unit: WaterBalanceInput["unit"]): number {
  const wan = CONFIG.thresholds.residualAbsHardWan;
  if (unit === "万m³/a") return wan;
  return round((wan * WAN_M3) / DAYS_PER_YEAR);
}

function hasAny(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k));
}

function ruleById(id: string): RuleDef | undefined {
  return CONFIG.rules.find((r) => r.id === id && r.enabled);
}

function finding(id: string, detail: string): QcFinding | null {
  const rule = ruleById(id);
  if (!rule) return null;
  return { id, level: rule.level, name: rule.name, detail, advice: rule.advice };
}

function lifeSharePct(input: WaterBalanceInput, demandTotal: number): number | null {
  if (demandTotal <= DISPLAY_EPS) return null;
  const life = input.demands
    .filter((d) => hasAny(d.name, CONFIG.keywords.lifeDemand))
    .reduce((s, d) => s + (Number(d.volume) || 0), 0);
  return round((life / demandTotal) * 100);
}

export function runQc(input: WaterBalanceInput, result: WaterBalanceResult): QcReport {
  const findings: QcFinding[] = [];
  const push = (item: QcFinding | null) => {
    if (item) findings.push(item);
  };

  const Q = Number(input.withdrawal) || 0;
  const R = Number(input.returnWater) || 0;
  const industry = `${input.industry} ${input.projectName}`;
  const industrial = hasAny(industry, CONFIG.keywords.industrial);
  const highConsume = hasAny(industry, CONFIG.keywords.highConsume);
  const hardAbs = residualHardThreshold(input.unit);

  if (input.reliability == null) {
    push(finding("reliability-required", "设计保证率尚未选择。"));
  }
  if (Q <= DISPLAY_EPS) {
    push(finding("withdrawal-positive", `取水 Q = ${Q} ${input.unit}，未形成有效取水规模。`));
  }
  if (result.demandTotal <= DISPLAY_EPS) {
    push(finding("demand-positive", "需水合计 D = 0，缺少可校核的用水户分项。"));
  }
  if (result.status !== "idle" && Math.abs(result.residual) > hardAbs) {
    push(
      finding(
        "residual-over-threshold",
        `|Δ| = ${Math.abs(result.residual)} ${input.unit}，超过硬校验阈值 ${hardAbs} ${input.unit}（由 ${CONFIG.thresholds.residualAbsHardWan} 万m³/a 换算）。`
      )
    );
  }
  if (Q > DISPLAY_EPS && R > Q + DISPLAY_EPS) {
    push(finding("return-exceeds-withdrawal", `退水 R = ${R} ${input.unit} > 取水 Q = ${Q} ${input.unit}。`));
  }
  if (result.consume < -DISPLAY_EPS) {
    push(finding("consume-negative", `耗水 C = Q − R = ${result.consume} ${input.unit}。`));
  }

  const lifePct = lifeSharePct(input, result.demandTotal);
  const { lifeShareMinPct, lifeShareMaxPct, returnRateMinPct, returnRateMaxPct } = CONFIG.thresholds;
  if (industrial && lifePct != null && (lifePct < lifeShareMinPct || lifePct > lifeShareMaxPct)) {
    push(
      finding(
        "life-share-outlier",
        `生活用水占需水 ${lifePct}% ，超出工业园区经验区间 ${lifeShareMinPct}%–${lifeShareMaxPct}%（经验值·示意）。`
      )
    );
  }

  if (
    industrial &&
    Q > DISPLAY_EPS &&
    (result.returnRate < returnRateMinPct || result.returnRate > returnRateMaxPct)
  ) {
    push(
      finding(
        "return-rate-outlier",
        `退水率 ${result.returnRate}%，不在一般工业示意区间 ${returnRateMinPct}%–${returnRateMaxPct}%。`
      )
    );
  }

  if (
    Number.isFinite(input.year) &&
    Number.isFinite(input.horizonYear) &&
    input.horizonYear < input.year
  ) {
    push(
      finding(
        "horizon-before-base",
        `水平年 ${input.horizonYear} 早于编制/基准年 ${input.year}。`
      )
    );
  }

  if (input.sourceType === "地下水" && highConsume) {
    push(
      finding(
        "groundwater-high-consume",
        `水源为地下水，项目描述含高耗水工业关键词，取水许可与禁限采约束需单独论证。`
      )
    );
  }

  const hardCount = findings.filter((f) => f.level === "hard").length;
  const softCount = findings.filter((f) => f.level === "soft").length;
  return {
    findings,
    hardCount,
    softCount,
    canExport: hardCount === 0,
  };
}

export function qcConfigNote(): string {
  return CONFIG.note;
}
