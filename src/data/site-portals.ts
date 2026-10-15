/**
 * 站点入口优先级：求职主线 > 作品浏览 / 互动演示 > 趣味支线。
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

export const SITE_PORTALS: SitePortal[] = [
  {
    id: "hydro",
    href: "/hydrobench",
    title: "智慧水利",
    blurb: "水情看板、室内作业台与户外应急——求职主线入口",
    cta: "进入主线",
    tier: "primary",
    hue: "#2ec4b6",
    icon: "mdi:water",
  },
  {
    id: "atlas",
    href: "/atlas",
    title: "作品展厅",
    blurb: "用轨道 / 地图 / 列表浏览全部项目，并打开演示",
    cta: "浏览作品",
    tier: "skill",
    hue: "#c4b5fd",
    icon: "mdi:view-dashboard-outline",
  },
  {
    id: "labs",
    href: "/labs",
    title: "互动演示",
    blurb: "平面动画与三维物理，边调参数边看效果",
    cta: "开始体验",
    tier: "skill",
    hue: "#e44c65",
    icon: "mdi:play-box-multiple-outline",
  },
  {
    id: "life-sim",
    href: "/life-sim",
    title: "人生模拟",
    blurb: "趣味转盘故事，不占求职主线位置",
    cta: "打开玩法",
    tier: "side",
    hue: "#f4a261",
    icon: "mdi:dice-multiple",
  },
];

export const PRIMARY_PORTALS = SITE_PORTALS.filter((p) => p.tier === "primary");
export const SKILL_PORTALS = SITE_PORTALS.filter((p) => p.tier === "skill");
export const SIDE_PORTALS = SITE_PORTALS.filter((p) => p.tier === "side");

/** 平面场景展示顺序：水利相关与观感强的优先 */
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

/** 三维场景展示顺序：冲击力强的优先 */
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
