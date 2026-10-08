/** 多领域人生模拟 — 共享类型（参考 BitLife / 人生重开：属性门槛 + 权重池 + 长程依赖） */

export type StatMap = Record<string, number>;

export type WeightOption = {
  id: string;
  label: string;
  /** 基础权重 */
  weight: number;
  /** 选中后属性变化 */
  delta?: StatMap;
  /** 打标：写入 flags，供后续 include/exclude */
  addFlags?: string[];
  removeFlags?: string[];
  /** 压入后续事件模板 id */
  enqueue?: string[];
};

export type EventCard = {
  id: string;
  title: string;
  blurb?: string;
  /** 年龄/赛年区间 */
  minAge?: number;
  maxAge?: number;
  /** 需要全部满足的属性下限 */
  requireStats?: StatMap;
  /** 任一超限则禁用 */
  forbidStats?: StatMap;
  /** 必须曾发生的 flag */
  includeFlags?: string[];
  /** 出现过则禁用 */
  excludeFlags?: string[];
  options: WeightOption[];
  /** 自适应：按属性抬高/压低某些 option */
  adapt?: {
    boostIds?: string[];
    cutIds?: string[];
    byStats?: string[];
    scale?: number;
  };
  kind?: string;
};

export type DomainMeta = {
  id: string;
  title: string;
  tagline: string;
  href: string;
  accent: string;
  stats: { key: string; label: string }[];
  judges?: { key: string; label: string }[];
};

export type LifeRun = {
  domainId: string;
  age: number;
  stats: StatMap;
  flags: string[];
  log: { age: number; title: string; pick: string }[];
  queue: EventCard[];
  ended: boolean;
  seed: string;
};
