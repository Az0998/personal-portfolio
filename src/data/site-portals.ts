/**
 * 站点体验入口优先级：求职主链 > 能力展厅 > 趣味支线。
 * 首页 / 作品区按此排序露出，不把 demo 塞进 CMS 精选。
 */

export type PortalTier = "primary" | "skill" | "side";

export type SitePortal = {
  id: string;
  href: string;
  title: string;
  blurb: string;
  cta: string;
  tier: PortalTier;
  hue: string;
  icon: string;
};

/** 有价值优先：主链 → 星图/实验室 → 人生模拟等支线 */
export const SITE_PORTALS: SitePortal[] = [
  {
    id: "hydro",
    href: "/hydrobench",
    title: "智慧水利总览",
    blurb: "水情态势 · 室内台 · 户外台——求职主链入口",
    cta: "进入主链",
    tier: "primary",
    hue: "#2ec4b6",
    icon: "mdi:water",
  },
  {
    id: "labs",
    href: "/labs",
    title: "效果集成馆",
    blurb: "Canvas 视效 + 三维物理，展示数值与交互表达",
    cta: "逛实验室",
    tier: "skill",
    hue: "#e44c65",
    icon: "mdi:atom-variant",
  },
  {
    id: "atlas",
    href: "/atlas",
    title: "作品星图",
    blurb: "星轨 / 星图 / 展柜三种看法逛完整作品",
    cta: "打开星图",
    tier: "skill",
    hue: "#c4b5fd",
    icon: "mdi:star-four-points",
  },
  {
    id: "life-sim",
    href: "/life-sim",
    title: "人生模拟枢纽",
    blurb: "趣味支线，不占主链精选",
    cta: "打开支线",
    tier: "side",
    hue: "#f4a261",
    icon: "mdi:dice-multiple",
  },
];

export const PRIMARY_PORTALS = SITE_PORTALS.filter((p) => p.tier === "primary");
export const SKILL_PORTALS = SITE_PORTALS.filter((p) => p.tier === "skill");
export const SIDE_PORTALS = SITE_PORTALS.filter((p) => p.tier === "side");

/** 2D 视效场景展示顺序：贴合主链 / 视觉冲击优先 */
export const VIZ_DISPLAY_ORDER = [
  "hydrograph",
  "chaos",
  "fluid",
  "reaction",
  "cloth",
  "metaballs",
  "fireworks",
  "piston",
  "optics",
  "julia",
  "boids",
  "waves",
  "epicycles",
  "rays",
  "cosmos",
  "pendulum",
  "aurora",
  "lsystem",
] as const;

/** 3D 物理场景展示顺序：冲击力强的优先 */
export const PHYS_DISPLAY_ORDER = [
  "collide",
  "water",
  "chain",
  "magnet",
  "fountain",
  "incline",
  "domino",
  "sandbox",
] as const;

export function orderByIds<T extends { id: string }>(
  items: T[],
  order: readonly string[]
): T[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)
  );
}
