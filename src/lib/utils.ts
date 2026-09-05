export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function joinTags(tags: string[]): string {
  return tags.join(", ");
}

/** 作品分类：按站点叙事分组，顺序即筛选条顺序 */
export const WORK_CATEGORIES = [
  { value: "hydro", label: "智慧水利" },
  { value: "demo", label: "在线演示" },
  { value: "paper", label: "论文研究" },
  { value: "tool", label: "工具应用" },
  { value: "design", label: "设计创作" },
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number]["value"];

/** 旧分类 → 新分类（兼容库里尚未改过的条目） */
const LEGACY_CATEGORY: Record<string, WorkCategory> = {
  project: "demo",
  code: "tool",
  media: "design",
  other: "tool",
  hydro: "hydro",
  demo: "demo",
  paper: "paper",
  tool: "tool",
  design: "design",
};

/** 按标题纠偏（库内仍是旧 category 时也能正确分组） */
const TITLE_CATEGORY: Record<string, WorkCategory> = {
  "水资源论证 / 水平衡报告生成器": "hydro",
  "新安江机理预报对照台": "hydro",
  "流域「一张图」GIS 小站": "hydro",
  "智慧水利管理系统": "hydro",
  "HydroInfo 流域水情信息平台": "hydro",
  "HydroBench · 水文双工作台": "hydro",
  "波托马克流域生态水文耦合分析": "hydro",
  "水文测验与资料整编实践合集": "hydro",
  "波托马克河多时效径流深度学习预报": "paper",
  "洮河与黄河水文地理综述": "paper",
  "东海陆架溶解氧中长期预报": "paper",
  "匿名问卷 · 分发填写与汇总": "demo",
  "易理占筮 · 太极八卦六十四阵": "demo",
  "Novel Studio 写作工作台": "demo",
  "中国象棋 · AlphaZero 策略网": "demo",
  "Graph-RAG Vault · 知识图谱检索": "demo",
  "临时文件柜 · 到期自毁分享": "tool",
  "剪贴板智能可视化仪表板": "tool",
  "庄方宜 Q 版桌面宠物": "design",
  "植物叶片形态分析演示文稿": "design",
};

export function normalizeCategory(category: string): WorkCategory {
  return LEGACY_CATEGORY[category] ?? "demo";
}

export function resolveWorkCategory(title: string, category: string): WorkCategory {
  return TITLE_CATEGORY[title] ?? normalizeCategory(category);
}

export function getCategoryLabel(category: string): string {
  const key = normalizeCategory(category);
  return WORK_CATEGORIES.find((c) => c.value === key)?.label ?? category;
}

export function getWorkCategoryLabel(title: string, category: string): string {
  const key = resolveWorkCategory(title, category);
  return WORK_CATEGORIES.find((c) => c.value === key)?.label ?? category;
}

/** 筛选栏只展示站点实际用到的分类，按 WORK_CATEGORIES 顺序 */
export function orderedWorkCategories(values: string[]): string[] {
  const present = new Set(values.map(normalizeCategory));
  return WORK_CATEGORIES.map((c) => c.value).filter((v) => present.has(v));
}
