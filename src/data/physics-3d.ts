export type PhysSceneId =
  | "collide"
  | "incline"
  | "water"
  | "domino"
  | "sandbox"
  | "chain"
  | "magnet"
  | "fountain";

export type PhysParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type PhysSceneMeta = {
  id: PhysSceneId;
  title: string;
  emoji: string;
  tagline: string;
  blurb: string;
  hue: string;
  params: PhysParam[];
};

export const PHYS_SCENES: PhysSceneMeta[] = [
  {
    id: "collide",
    title: "球堆碰撞",
    emoji: "🎱",
    tagline: "落下、弹开、堆在一起",
    blurb: "彩色球落入围栏，互相碰撞后堆叠。可调重力、弹性和摩擦，看它们跳得高还是很快停住。",
    hue: "#e44c65",
    params: [
      { key: "gravity", label: "重力", min: 4, max: 25, step: 0.5, default: 12 },
      { key: "restitution", label: "弹性", min: 0, max: 0.95, step: 0.05, default: 0.45 },
      { key: "friction", label: "摩擦", min: 0, max: 1, step: 0.05, default: 0.35 },
      { key: "count", label: "球数", min: 8, max: 40, step: 1, default: 18 },
    ],
  },
  {
    id: "incline",
    title: "斜面滑动",
    emoji: "📐",
    tagline: "倾角越大，滑得越快",
    blurb: "方块和圆球从斜面滑下。摩擦大了就难起步；圆球更容易滚起来。",
    hue: "#f4a261",
    params: [
      { key: "angle", label: "倾角°", min: 8, max: 45, step: 1, default: 22 },
      { key: "friction", label: "摩擦", min: 0, max: 1, step: 0.05, default: 0.4 },
      { key: "gravity", label: "重力", min: 6, max: 20, step: 0.5, default: 12 },
    ],
  },
  {
    id: "water",
    title: "水面浮力",
    emoji: "🌊",
    tagline: "沉下去，再被托起来",
    blurb: "半透明水池里，物体浸入后会上浮并减速。可调浮力强弱与水面波幅。",
    hue: "#2ec4b6",
    params: [
      { key: "density", label: "浮力", min: 0.4, max: 2.2, step: 0.05, default: 1.15 },
      { key: "drag", label: "水阻力", min: 0.5, max: 8, step: 0.1, default: 2.5 },
      { key: "wave", label: "波幅", min: 0, max: 0.25, step: 0.01, default: 0.08 },
      { key: "gravity", label: "重力", min: 6, max: 18, step: 0.5, default: 10 },
    ],
  },
  {
    id: "domino",
    title: "多米诺",
    emoji: "🁣",
    tagline: "一块推倒，整排倒下去",
    blurb: "冲击块撞倒第一块立牌，动能沿一排传递。可调间距与弹性。",
    hue: "#c4b5fd",
    params: [
      { key: "gap", label: "间距", min: 0.05, max: 0.35, step: 0.01, default: 0.12 },
      { key: "restitution", label: "弹性", min: 0, max: 0.6, step: 0.05, default: 0.1 },
      { key: "impulse", label: "初速度", min: 2, max: 14, step: 0.5, default: 7 },
    ],
  },
  {
    id: "sandbox",
    title: "自由沙盒",
    emoji: "🧪",
    tagline: "点击地面生成物体",
    blurb: "围栏里随便玩：点击地面生成球或方块，再调弹性与摩擦看反应。",
    hue: "#7bdff2",
    params: [
      { key: "restitution", label: "弹性", min: 0, max: 0.95, step: 0.05, default: 0.55 },
      { key: "friction", label: "摩擦", min: 0, max: 1, step: 0.05, default: 0.4 },
      { key: "gravity", label: "重力", min: 4, max: 22, step: 0.5, default: 12 },
      { key: "size", label: "尺寸", min: 0.2, max: 0.7, step: 0.05, default: 0.35 },
    ],
  },
  {
    id: "chain",
    title: "绳链摆动",
    emoji: "⛓️",
    tagline: "珠串连成绳，受冲击后晃动",
    blurb: "一串球连成绳链挂在空中，末端被轻轻推开后会来回摆。可调节数与晃动强弱。",
    hue: "#fbbf24",
    params: [
      { key: "links", label: "节数", min: 6, max: 16, step: 1, default: 10 },
      { key: "damping", label: "阻尼", min: 0.01, max: 0.2, step: 0.01, default: 0.06 },
      { key: "impulse", label: "侧推", min: 0, max: 12, step: 0.5, default: 5 },
    ],
  },
  {
    id: "magnet",
    title: "磁力汇聚",
    emoji: "🧲",
    tagline: "外围小球被中心吸过去",
    blurb: "中心像磁铁一样吸引周围小球；初速度越大，越容易绕着转再落入。",
    hue: "#f87171",
    params: [
      { key: "strength", label: "磁力", min: 8, max: 60, step: 1, default: 28 },
      { key: "orbit", label: "初速度", min: 0, max: 8, step: 0.2, default: 3.2 },
      { key: "count", label: "小球数", min: 6, max: 24, step: 1, default: 12 },
    ],
  },
  {
    id: "fountain",
    title: "粒子喷泉",
    emoji: "⛲",
    tagline: "上抛、弹跳、然后消失",
    blurb: "从底部连续喷出小球，落地弹几下后自动消失。可调喷速、散开与弹性。",
    hue: "#38bdf8",
    params: [
      { key: "speed", label: "喷速", min: 4, max: 14, step: 0.2, default: 8 },
      { key: "spread", label: "散开", min: 0.1, max: 1.2, step: 0.05, default: 0.45 },
      { key: "restitution", label: "弹性", min: 0.1, max: 0.9, step: 0.05, default: 0.55 },
      { key: "rate", label: "喷出频率", min: 2, max: 14, step: 1, default: 6 },
    ],
  },
];

export const PHYS_BY_ID = new Map(PHYS_SCENES.map((s) => [s.id, s]));

export function defaultPhysParams(scene: PhysSceneMeta): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of scene.params) out[p.key] = p.default;
  return out;
}
