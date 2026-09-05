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
  reliability: 75 | 90 | 95;
  unit: "万m³/a";
  withdrawal: number;
  returnWater: number;
  loss: number;
  demands: DemandRow[];
};

export type WaterBalanceResult = {
  demandTotal: number;
  consume: number;
  returnRate: number;
  consumeRate: number;
  lossRate: number;
  residual: number;
  closed: boolean;
  flags: string[];
};
