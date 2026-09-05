import { cloneInput } from "./compute";
import type { WaterBalanceInput } from "./types";

export const PROJECT_KIND = "az09.water-balance-project";
export const DOC_VERSION = "1.1.0";

export type ProjectFile = {
  kind: typeof PROJECT_KIND;
  version: string;
  exportedAt: string;
  input: WaterBalanceInput;
};

export function toProjectFile(input: WaterBalanceInput, exportedAt?: string): ProjectFile {
  return {
    kind: PROJECT_KIND,
    version: DOC_VERSION,
    exportedAt: exportedAt ?? new Date().toISOString(),
    input: cloneInput(input),
  };
}

export function stringifyProject(input: WaterBalanceInput): string {
  return JSON.stringify(toProjectFile(input), null, 2);
}

export function parseProject(raw: string): WaterBalanceInput {
  const data = JSON.parse(raw) as Partial<ProjectFile> & Partial<WaterBalanceInput>;
  const input = data.kind === PROJECT_KIND && data.input ? data.input : (data as WaterBalanceInput);
  if (!input || typeof input !== "object") throw new Error("不是可识别的项目 JSON");
  if (!Array.isArray(input.demands)) throw new Error("项目 JSON 缺少需水结构 demands");
  return cloneInput({
    projectName: String(input.projectName || ""),
    location: String(input.location || ""),
    owner: String(input.owner || ""),
    industry: String(input.industry || ""),
    year: Number(input.year) || 2026,
    horizonYear: Number(input.horizonYear) || 2030,
    sourceName: String(input.sourceName || ""),
    sourceType:
      input.sourceType === "地下水" ||
      input.sourceType === "再生水" ||
      input.sourceType === "混合水源"
        ? input.sourceType
        : "地表水",
    reliability:
      input.reliability === 75 || input.reliability === 90 || input.reliability === 95
        ? input.reliability
        : null,
    unit: input.unit === "m³/d" ? "m³/d" : "万m³/a",
    withdrawal: Number(input.withdrawal) || 0,
    returnWater: Number(input.returnWater) || 0,
    loss: Number(input.loss) || 0,
    demands: input.demands.map((d, i) => ({
      id: String(d?.id || `d-${i}`),
      name: String(d?.name || ""),
      volume: Number(d?.volume) || 0,
      note: String(d?.note || ""),
    })),
  });
}

export function fileBase(input: WaterBalanceInput): string {
  const slug = (input.projectName || "water-balance").replace(/[\\/:*?"<>|]/g, "").slice(0, 32);
  return `${slug}-水平衡报告-v${DOC_VERSION}`;
}
