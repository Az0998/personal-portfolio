export type VolumeUnit = "万m³/a" | "m³/d";

export type DemandRow = {
  id: string;
  name: string;
  volume: number;
  note: string;
};

export type WaterBalanceInput = {
  projectName: string;
  location: string;
  owner: string;
  industry: string;
  year: number;
  horizonYear: number;
  sourceName: string;
  sourceType: "地表水" | "地下水" | "再生水" | "混合水源";
  reliability: 75 | 90 | 95 | null;
  unit: VolumeUnit;
  withdrawal: number;
  returnWater: number;
  loss: number;
  demands: DemandRow[];
};

export type QcLevel = "hard" | "soft";

export type QcFinding = {
  id: string;
  level: QcLevel;
  name: string;
  detail: string;
  advice: string;
};

export type QcReport = {
  findings: QcFinding[];
  hardCount: number;
  softCount: number;
  canExport: boolean;
};

export type BalanceStatus = "idle" | "closed" | "open";

export type WaterBalanceResult = {
  demandTotal: number;
  demandChecksum: number;
  demandGap: number;
  consume: number;
  returnRate: number;
  consumeRate: number;
  lossRate: number;
  residual: number;
  closed: boolean;
  status: BalanceStatus;
  flags: string[];
  formulas: {
    demand: string;
    consume: string;
    residual: string;
  };
};
