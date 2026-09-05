/**
 * 智慧水利主链导览：5 步最短路径。
 * URL 约定：?tour=1&from=guide&step=1..5 ；结束：/hydrobench?tour=done
 */

export type GuideStepId = 1 | 2 | 3 | 4 | 5;

export type GuideStep = {
  id: GuideStepId;
  title: string;
  blurb: string;
  /** 最短打开路径（含导览参数） */
  href: string;
  /** 是否落在 hydrobench 页内 tab */
  hubTab?: "studio" | "info" | "field";
};

/** hydro 分类下的链路子标签（作品卡 / 筛选） */
export type HydroLane = "态势" | "工具" | "空间" | "模型" | "文档" | "论文";

export const HYDRO_LANES: HydroLane[] = ["态势", "工具", "空间", "模型", "文档", "论文"];

/** 主链 5 步（作品精选顺序 & 卡片「n/5」徽章） */
export const HYDRO_CHAIN_STEPS = [
  {
    step: 1 as const,
    title: "HydroBench · 水文双工作台",
    lane: "工具" as HydroLane,
    badge: "1/5",
    href: "/hydrobench?tab=studio",
  },
  {
    step: 2 as const,
    title: "流域「一张图」GIS 小站",
    lane: "空间" as HydroLane,
    badge: "2/5",
    href: "/watershed-map",
  },
  {
    step: 3 as const,
    title: "HydroInfo 流域水情信息平台",
    lane: "态势" as HydroLane,
    badge: "3/5",
    href: "/hydrobench?tab=info",
  },
  {
    step: 4 as const,
    title: "新安江机理预报对照台",
    lane: "模型" as HydroLane,
    badge: "4/5",
    href: "/xaj-bench",
  },
  {
    step: 5 as const,
    title: "水资源论证 / 水平衡报告生成器",
    lane: "文档" as HydroLane,
    badge: "5/5",
    href: "/water-balance-report",
  },
] as const;

export type HydroChainStep = (typeof HYDRO_CHAIN_STEPS)[number];

/** 可选进首页精选的 Hydro-ML（论文 / 数据驱动对照） */
export const HYDRO_ML_TITLE = "波托马克河多时效径流深度学习预报";

/** 首页精选：仅主链 + 可选 Hydro-ML（demo 默认不进首屏） */
export const FEATURED_WORK_TITLES: readonly string[] = [
  ...HYDRO_CHAIN_STEPS.map((s) => s.title),
  HYDRO_ML_TITLE,
];

/** @deprecated 用 HYDRO_CHAIN_STEPS / FEATURED_WORK_TITLES */
export const HYDRO_CHAIN_TITLES = HYDRO_CHAIN_STEPS.map((s) => s.title);

/** 非主链 hydro 作品的子标签 */
const HYDRO_LANE_BY_TITLE: Record<string, HydroLane> = {
  [HYDRO_ML_TITLE]: "论文",
  智慧水利管理系统: "工具",
  波托马克流域生态水文耦合分析: "论文",
  水文测验与资料整编实践合集: "工具",
};

export function getHydroChainMeta(title: string): HydroChainStep | null {
  return HYDRO_CHAIN_STEPS.find((s) => s.title === title) ?? null;
}

export function isHydroChainTitle(title: string) {
  return Boolean(getHydroChainMeta(title));
}

export function getHydroLane(title: string): HydroLane | null {
  return getHydroChainMeta(title)?.lane ?? HYDRO_LANE_BY_TITLE[title] ?? null;
}

export function isFeaturedWorkTitle(title: string) {
  return FEATURED_WORK_TITLES.includes(title);
}

/** 主链上下游（不含自身）；用于作品详情推荐 */
export function getChainNeighbors(title: string): {
  upstream: HydroChainStep | null;
  downstream: HydroChainStep | null;
  current: HydroChainStep | null;
  mlSide: boolean;
} {
  const idx = HYDRO_CHAIN_STEPS.findIndex((s) => s.title === title);
  if (idx < 0) {
    return {
      upstream: null,
      downstream: null,
      current: null,
      mlSide: false,
    };
  }
  return {
    current: HYDRO_CHAIN_STEPS[idx],
    upstream: idx > 0 ? HYDRO_CHAIN_STEPS[idx - 1] : null,
    downstream:
      idx < HYDRO_CHAIN_STEPS.length - 1 ? HYDRO_CHAIN_STEPS[idx + 1] : null,
    mlSide: idx === 3, // 模型步旁挂 Hydro-ML
  };
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: "室内作业台",
    blurb: "采集与整编",
    href: "/hydrobench?tab=studio&tour=1&from=guide&step=1",
    hubTab: "studio",
  },
  {
    id: 2,
    title: "流域一张图",
    blurb: "空间落点",
    href: "/hydrobench?tab=map&tour=1&from=guide&step=2",
  },
  {
    id: 3,
    title: "站网态势",
    blurb: "多站过程线",
    href: "/hydrobench?tab=info&tour=1&from=guide&step=3",
    hubTab: "info",
  },
  {
    id: 4,
    title: "产汇流对照",
    blurb: "机理 ↔ 基线",
    href: "/hydrobench?tab=model&tour=1&from=guide&step=4",
  },
  {
    id: 5,
    title: "论证草稿",
    blurb: "水平衡文档",
    href: "/hydrobench?tab=doc&tour=1&from=guide&step=5",
  },
];

export const GUIDE_HUB = "/hydrobench";
export const GUIDE_DONE = "/hydrobench?tour=done";
export const GUIDE_TOTAL = GUIDE_STEPS.length;

export function parseGuideStep(raw: string | null): GuideStepId | null {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

export function isGuideMode(search: URLSearchParams | { get: (k: string) => string | null }) {
  return search.get("tour") === "1" && search.get("from") === "guide";
}

export function guideStepHref(id: GuideStepId) {
  return GUIDE_STEPS.find((s) => s.id === id)!.href;
}

export function guidePrevHref(id: GuideStepId) {
  if (id <= 1) return GUIDE_HUB;
  return guideStepHref((id - 1) as GuideStepId);
}

export function guideNextHref(id: GuideStepId) {
  if (id >= GUIDE_TOTAL) return GUIDE_DONE;
  return guideStepHref((id + 1) as GuideStepId);
}

/** ≤120 字自我介绍（可复制） */
export const GUIDE_INTRO_120 =
  "张森捷，兰州大学水文与水资源。面向智慧水利/水信息，可演示主链：采集整编→流域一张图→态势看板→新安江与学习预报对照→水平衡论证文档。意向南京/广州设计院与信息化岗位。";

export const GUIDE_LINKS = [
  { label: "个人站 · 智慧水利总览", href: "https://zhangsjqaq.vexr.dev/hydrobench" },
  { label: "GitHub · Az0998", href: "https://github.com/Az0998" },
  { label: "简历 PDF", href: "/resume.pdf" },
] as const;
