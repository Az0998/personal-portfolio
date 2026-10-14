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
    title: "堆叠碰撞",
    emoji: "🎱",
    tagline: "刚体球 · 弹性碰撞 · 重力堆积",
    blurb: "彩色球体落入围栏，互相碰撞并堆叠。可调重力、弹性与摩擦，观察能量耗散。",
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
    tagline: "斜面 · 静/动摩擦 · 滑移",
    blurb: "方块与圆球沿可调倾角斜面下滑。摩擦越大越难起滑；对比滚动与滑动差异。",
    hue: "#f4a261",
    params: [
      { key: "angle", label: "倾角°", min: 8, max: 45, step: 1, default: 22 },
      { key: "friction", label: "摩擦", min: 0, max: 1, step: 0.05, default: 0.4 },
      { key: "gravity", label: "重力", min: 6, max: 20, step: 0.5, default: 12 },
    ],
  },
  {
    id: "water",
    title: "浮力与水面",
    emoji: "🌊",
    tagline: "浮力 · 阻尼 · 波面渲染",
    blurb: "半透明水池 + 顶点波面。浸入物体受浮力与粘滞阻尼，可调密度比与波幅。",
    hue: "#2ec4b6",
    params: [
      { key: "density", label: "浮力倍率", min: 0.4, max: 2.2, step: 0.05, default: 1.15 },
      { key: "drag", label: "水阻尼", min: 0.5, max: 8, step: 0.1, default: 2.5 },
      { key: "wave", label: "波幅", min: 0, max: 0.25, step: 0.01, default: 0.08 },
      { key: "gravity", label: "重力", min: 6, max: 18, step: 0.5, default: 10 },
    ],
  },
  {
    id: "domino",
    title: "多米诺推倒",
    emoji: "🁣",
    tagline: "链式碰撞 · 动量传递",
    blurb: "一排立牌被冲击块推倒，观察接触约束与动量沿链传递。可调间距与弹性。",
    hue: "#c4b5fd",
    params: [
      { key: "gap", label: "间距", min: 0.05, max: 0.35, step: 0.01, default: 0.12 },
      { key: "restitution", label: "弹性", min: 0, max: 0.6, step: 0.05, default: 0.1 },
      { key: "impulse", label: "初冲量", min: 2, max: 14, step: 0.5, default: 7 },
    ],
  },
  {
    id: "sandbox",
    title: "物理沙盒",
    emoji: "🧪",
    tagline: "点击生成 · 混合刚体 · 实时交互",
    blurb: "围栏沙盒：点击地面生成球体/方块。综合碰撞、摩擦与弹跳，适合随手试参数。",
    hue: "#7bdff2",
    params: [
      { key: "restitution", label: "弹性", min: 0, max: 0.95, step: 0.05, default: 0.55 },
      { key: "friction", label: "摩擦", min: 0, max: 1, step: 0.05, default: 0.4 },
      { key: "gravity", label: "重力", min: 4, max: 22, step: 0.5, default: 12 },
      { key: "size", label: "生成尺寸", min: 0.2, max: 0.7, step: 0.05, default: 0.35 },
    ],
  },
  {
    id: "chain",
    title: "绳链摆动",
    emoji: "⛓️",
    tagline: "铰链约束 · 多节刚体 · 冲击",
    blurb: "一串球用距离约束连成绳链，末端可受冲击。可调节数与约束刚度感（阻尼）。",
    hue: "#fbbf24",
    params: [
      { key: "links", label: "节数", min: 6, max: 16, step: 1, default: 10 },
      { key: "damping", label: "阻尼", min: 0.01, max: 0.2, step: 0.01, default: 0.06 },
      { key: "impulse", label: "侧向冲量", min: 0, max: 12, step: 0.5, default: 5 },
    ],
  },
  {
    id: "magnet",
    title: "磁力吸引",
    emoji: "🧲",
    tagline: "中心吸力 · 轨道 · 碰撞",
    blurb: "中心球体施加指向力，外围小球被吸引并碰撞。可调磁力与轨道初速，看螺旋落入。",
    hue: "#f87171",
    params: [
      { key: "strength", label: "磁力", min: 8, max: 60, step: 1, default: 28 },
      { key: "orbit", label: "初切速", min: 0, max: 8, step: 0.2, default: 3.2 },
      { key: "count", label: "粒子球", min: 6, max: 24, step: 1, default: 12 },
    ],
  },
  {
    id: "fountain",
    title: "粒子喷泉",
    emoji: "⛲",
    tagline: "喷射 · 落地弹跳 · 寿命回收",
    blurb: "连续上抛小球模拟喷泉，落地弹跳后超时回收。可调喷速、散开角与弹性。",
    hue: "#38bdf8",
    params: [
      { key: "speed", label: "喷速", min: 4, max: 14, step: 0.2, default: 8 },
      { key: "spread", label: "散开", min: 0.1, max: 1.2, step: 0.05, default: 0.45 },
      { key: "restitution", label: "弹性", min: 0.1, max: 0.9, step: 0.05, default: 0.55 },
      { key: "rate", label: "射流", min: 2, max: 14, step: 1, default: 6 },
    ],
  },
];

export const PHYS_BY_ID = new Map(PHYS_SCENES.map((s) => [s.id, s]));

export function defaultPhysParams(scene: PhysSceneMeta): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of scene.params) out[p.key] = p.default;
  return out;
}
