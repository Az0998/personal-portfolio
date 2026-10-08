export type Grade = "S+" | "S" | "A" | "B" | "C" | "D" | "E";

export type SixKey =
  | "aim"
  | "utility"
  | "sense"
  | "mentality"
  | "attitude"
  | "leadership";

/** 判定维：影响转盘占比与生活分支，不强制进雷达也可显示 */
export type JudgeKey = "appearance" | "loyalty" | "fame" | "form" | "clutch";

export type SixStats = Record<SixKey, number>;
export type JudgeStats = Record<JudgeKey, number>;

export type StatDelta = Partial<Record<SixKey | JudgeKey, number>>;

export type WheelOption = {
  id: string;
  label: string;
  weight: number;
  color: string;
  meta?: Record<string, string | number | boolean>;
  /** 选中后数值变化 */
  effects?: StatDelta;
  /** 压入事件队列的后续事件 id（模板或自定义） */
  enqueue?: string[];
  /** 标记：冠军+1、转会、退役等 */
  flags?: string[];
};

export type PhaseId =
  | "origin_region"
  | "origin_country"
  | "birth_era"
  | "debut_year"
  | "team_pick"
  | "motivation"
  | "intl_squad"
  | "igl"
  | "role_ct"
  | "role_t"
  | "grade_aim"
  | "grade_utility"
  | "grade_sense"
  | "grade_attitude"
  | "grade_mentality"
  | "grade_appearance"
  | "year_loop"
  | "event_spin"
  | "season_recap"
  | "summary";

export type CareerEvent = {
  year: number;
  title: string;
  detail: string;
  kind: "team" | "rank" | "major" | "finals" | "form" | "life" | "match" | "custom" | "worldline";
};

/** 运行时事件实例（可来自模板 + 上下文填充） */
export type RuntimeEvent = {
  id: string;
  title: string;
  blurb?: string;
  options: WheelOption[];
  /** 自适应：按哪几个判定维抬高/压低某些 option id */
  adapt?: {
    boostIds?: string[];
    cutIds?: string[];
    by?: (SixKey | JudgeKey)[];
    scale?: number;
  };
  kind?: CareerEvent["kind"];
  context?: Record<string, string>;
};

/** 用户自定义事件（可插入队列） */
export type CustomEventDef = {
  id: string;
  title: string;
  blurb?: string;
  options: {
    id: string;
    label: string;
    weight: number;
    effects?: StatDelta;
    enqueue?: string[];
    flags?: string[];
  }[];
  createdAt: string;
};

export type PlayerState = {
  seed: string;
  region?: string;
  country?: string;
  birthEra?: string;
  debutYear?: number;
  motivation?: string;
  intlSquad?: boolean;
  isIgl?: boolean;
  roleCt?: string;
  roleT?: string;
  grades: Partial<Record<SixKey | "appearance", Grade>>;
  stats: SixStats;
  judges: JudgeStats;
  team?: string;
  year: number;
  majors: number;
  majorWins: number;
  trophiesYear: number;
  bestHltvRank: number | null;
  ratingPeak: number;
  hasPartner: boolean;
  events: CareerEvent[];
  /** FIFO 事件队列；非空时 phase=event_spin */
  queue: RuntimeEvent[];
  retired: boolean;
  history: { phase: string; label: string; picked: string }[];
  /** 当前赛年上下文 */
  ctx: {
    majorName?: string;
    map?: string;
    opponent?: string;
    half?: string;
    winRateBias?: number;
  };
};

export type SharePack = {
  v: 1 | 2;
  createdAt: string;
  player: PlayerState;
};
