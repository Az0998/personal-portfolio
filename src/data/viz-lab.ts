export type VizSceneId =
  | "piston"
  | "chaos"
  | "optics"
  | "fluid"
  | "rays"
  | "cosmos"
  | "pendulum"
  | "aurora"
  | "epicycles"
  | "boids"
  | "julia"
  | "waves"
  | "hydrograph"
  | "reaction"
  | "lsystem"
  | "cloth"
  | "metaballs"
  | "fireworks";

export type VizParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type VizSceneMeta = {
  id: VizSceneId;
  title: string;
  emoji: string;
  tagline: string;
  blurb: string;
  hue: string;
  params: VizParam[];
};

export const VIZ_SCENES: VizSceneMeta[] = [
  {
    id: "piston",
    title: "活塞机构",
    emoji: "⚙️",
    tagline: "转一圈，活塞来回走",
    blurb: "曲柄转动带动连杆，活塞做往复运动。右侧同步画出位移曲线，可调转速与尺寸。",
    hue: "#f4a261",
    params: [
      { key: "rpm", label: "转速", min: 20, max: 180, step: 1, default: 72 },
      { key: "crank", label: "曲柄半径", min: 28, max: 72, step: 1, default: 48 },
      { key: "rod", label: "连杆长度", min: 90, max: 180, step: 1, default: 130 },
    ],
  },
  {
    id: "chaos",
    title: "混沌轨迹",
    emoji: "🌀",
    tagline: "差一点点，路径就完全不同",
    blurb: "著名的蝴蝶形混沌轨迹投影到平面。参数微调后，两条几乎重合的线会渐渐分叉。",
    hue: "#e44c65",
    params: [
      { key: "sigma", label: "参数 σ", min: 4, max: 20, step: 0.1, default: 10 },
      { key: "rho", label: "参数 ρ", min: 10, max: 40, step: 0.1, default: 28 },
      { key: "beta", label: "参数 β", min: 1, max: 8, step: 0.05, default: 2.67 },
      { key: "trail", label: "拖尾长度", min: 400, max: 4000, step: 50, default: 1800 },
    ],
  },
  {
    id: "optics",
    title: "光脉冲通信",
    emoji: "📡",
    tagline: "把 0/1 变成光信号再读回来",
    blurb: "发送端把比特变成光脉冲，途中叠加噪声与展宽；接收端再判回 0/1，直观看通信质量。",
    hue: "#7bdff2",
    params: [
      { key: "bitrate", label: "速率", min: 2, max: 16, step: 1, default: 8 },
      { key: "noise", label: "噪声", min: 0, max: 0.55, step: 0.01, default: 0.12 },
      { key: "dispersion", label: "展宽", min: 0, max: 1, step: 0.01, default: 0.35 },
    ],
  },
  {
    id: "fluid",
    title: "彩色水流",
    emoji: "💧",
    tagline: "墨滴落入，被水流卷走",
    blurb: "彩色墨滴落入流动的水面，点击可激起波纹，看颜色如何被卷吸混合。",
    hue: "#2ec4b6",
    params: [
      { key: "viscosity", label: "粘稠", min: 0.86, max: 0.99, step: 0.005, default: 0.94 },
      { key: "spawn", label: "滴落频率", min: 0.01, max: 0.2, step: 0.01, default: 0.06 },
      { key: "swirl", label: "涡旋", min: 0.2, max: 2.2, step: 0.05, default: 1 },
    ],
  },
  {
    id: "rays",
    title: "光线折射",
    emoji: "🔦",
    tagline: "镜子反光，玻璃弯折光线",
    blurb: "一束光打在圆镜与玻璃球上，观察反射与折射路径。可调光源角度与玻璃折射率。",
    hue: "#f0c14a",
    params: [
      { key: "beams", label: "光线数", min: 12, max: 80, step: 1, default: 36 },
      { key: "ior", label: "折射率", min: 1.05, max: 2.2, step: 0.01, default: 1.45 },
      { key: "angle", label: "光源角", min: -50, max: 50, step: 1, default: -12 },
    ],
  },
  {
    id: "cosmos",
    title: "星空轨道",
    emoji: "🌌",
    tagline: "缓慢转动的夜空与行星",
    blurb: "星场缓缓视差移动，简化行星沿轨道公转。拖拽可转视角。",
    hue: "#c4b5fd",
    params: [
      { key: "density", label: "星数", min: 80, max: 420, step: 10, default: 220 },
      { key: "speed", label: "公转", min: 0.2, max: 2.5, step: 0.05, default: 1 },
      { key: "milky", label: "银河浓度", min: 0.2, max: 1.4, step: 0.05, default: 0.85 },
    ],
  },
  {
    id: "pendulum",
    title: "双摆轨迹",
    emoji: "🕰️",
    tagline: "两节摆杆，轨迹却很乱",
    blurb: "双摆末端画出彩色轨迹：初始差一点，路径就会完全不同。",
    hue: "#ff9aab",
    params: [
      { key: "l1", label: "上杆", min: 60, max: 140, step: 1, default: 100 },
      { key: "l2", label: "下杆", min: 50, max: 140, step: 1, default: 90 },
      { key: "g", label: "重力", min: 4, max: 18, step: 0.1, default: 9.8 },
    ],
  },
  {
    id: "aurora",
    title: "极光帘幕",
    emoji: "✨",
    tagline: "夜空里起伏的光带",
    blurb: "多层光帘缓缓起伏、变色，模拟极光。可调层数、闪烁与色调漂移。",
    hue: "#34d399",
    params: [
      { key: "bands", label: "层数", min: 2, max: 8, step: 1, default: 5 },
      { key: "flicker", label: "闪烁", min: 0.2, max: 2.5, step: 0.05, default: 1 },
      { key: "hueShift", label: "色漂", min: 0, max: 120, step: 1, default: 40 },
    ],
  },
  {
    id: "epicycles",
    title: "周转圆轨迹",
    emoji: "🔁",
    tagline: "小圆绕大圆画出复杂曲线",
    blurb: "多层圆圈叠在一起旋转，笔尖轨迹逐渐逼近目标形状。谐波越多轮廓越细。",
    hue: "#fb7185",
    params: [
      { key: "harmonics", label: "层数", min: 2, max: 24, step: 1, default: 8 },
      { key: "speed", label: "转速", min: 0.3, max: 2.5, step: 0.05, default: 1 },
      { key: "shape", label: "目标形", min: 0, max: 2, step: 1, default: 0 },
    ],
  },
  {
    id: "boids",
    title: "鸟群飞行",
    emoji: "🕊️",
    tagline: "各飞各的，却像一群",
    blurb: "每只「鸟」只看附近同伴：别撞、跟齐、聚拢。整体就会形成鸟群。点击可吓散。",
    hue: "#38bdf8",
    params: [
      { key: "count", label: "数量", min: 40, max: 180, step: 5, default: 90 },
      { key: "radius", label: "视野", min: 20, max: 90, step: 1, default: 42 },
      { key: "cohesion", label: "聚拢", min: 0.2, max: 2.5, step: 0.05, default: 1 },
    ],
  },
  {
    id: "julia",
    title: "分形图案",
    emoji: "🧬",
    tagline: "放大看细节层层嵌套",
    blurb: "每个像素按同一规则反复计算，形成可无限放大的彩色图案。拖动画布可改形状。",
    hue: "#a78bfa",
    params: [
      { key: "iter", label: "精细度", min: 20, max: 120, step: 1, default: 55 },
      { key: "zoom", label: "缩放", min: 0.6, max: 2.4, step: 0.05, default: 1.1 },
      { key: "palette", label: "配色", min: 0, max: 2, step: 1, default: 0 },
    ],
  },
  {
    id: "waves",
    title: "水面波纹",
    emoji: "🌊",
    tagline: "两处振源叠出干涉条纹",
    blurb: "两个振源同时荡起波纹，重叠处有的加强、有的抵消。点击可临时加第三处振源。",
    hue: "#22d3ee",
    params: [
      { key: "freq", label: "频率", min: 0.4, max: 2.8, step: 0.05, default: 1.2 },
      { key: "damp", label: "衰减", min: 0.96, max: 0.999, step: 0.001, default: 0.992 },
      { key: "amp", label: "振幅", min: 0.3, max: 2, step: 0.05, default: 1 },
    ],
  },
  {
    id: "hydrograph",
    title: "降雨过程线",
    emoji: "🌧️",
    tagline: "下雨 → 汇流 → 出口流量",
    blurb: "示意一场雨如何变成出口流量：雨峰越高、汇流越慢，过程线形态就不同。贴合室内水文岗讲解。",
    hue: "#2ec4b6",
    params: [
      { key: "peak", label: "雨峰", min: 0.4, max: 2.5, step: 0.05, default: 1.2 },
      { key: "lag", label: "滞后", min: 4, max: 28, step: 1, default: 12 },
      { key: "tp", label: "汇流时长", min: 6, max: 36, step: 1, default: 16 },
    ],
  },
  {
    id: "reaction",
    title: "斑图生长",
    emoji: "🧫",
    tagline: "图案自己蔓延成形",
    blurb: "两种物质互相作用，画面里会长出斑点或条纹。点击可投下一团「种子」；左右滑块改变生长节奏。",
    hue: "#f472b6",
    params: [
      { key: "feed", label: "补料", min: 0.02, max: 0.08, step: 0.001, default: 0.037 },
      { key: "kill", label: "消耗", min: 0.04, max: 0.07, step: 0.001, default: 0.06 },
      { key: "speed", label: "生长速度", min: 1, max: 8, step: 1, default: 3 },
    ],
  },
  {
    id: "lsystem",
    title: "分枝生长",
    emoji: "🌿",
    tagline: "从规则长成一棵树",
    blurb: "用简单规则反复生长出枝杈。代数越高越繁茂，分叉角与风摆可调。",
    hue: "#86efac",
    params: [
      { key: "depth", label: "生长代数", min: 2, max: 6, step: 1, default: 4 },
      { key: "angle", label: "分叉角", min: 12, max: 45, step: 1, default: 25 },
      { key: "wind", label: "风摆", min: 0, max: 1.5, step: 0.05, default: 0.45 },
    ],
  },
  {
    id: "cloth",
    title: "柔软布料",
    emoji: "🧵",
    tagline: "可拖拽的垂落布面",
    blurb: "布料由许多小点连成网，受重力下垂。按住某处拖动，会像扯布一样变形。",
    hue: "#fda4af",
    params: [
      { key: "stiffness", label: "软硬", min: 1, max: 8, step: 1, default: 4 },
      { key: "gravity", label: "重力", min: 0.05, max: 0.6, step: 0.01, default: 0.22 },
      { key: "damping", label: "阻尼", min: 0.96, max: 0.999, step: 0.001, default: 0.99 },
    ],
  },
  {
    id: "metaballs",
    title: "液态熔球",
    emoji: "🫧",
    tagline: "靠近就会融化合并",
    blurb: "几个彩色球体在画面里漂移，靠近时轮廓会像液体一样融在一起。",
    hue: "#67e8f9",
    params: [
      { key: "count", label: "球数", min: 3, max: 10, step: 1, default: 5 },
      { key: "threshold", label: "融合度", min: 0.8, max: 2.2, step: 0.05, default: 1.15 },
      { key: "speed", label: "漂移", min: 0.3, max: 2, step: 0.05, default: 0.9 },
    ],
  },
  {
    id: "fireworks",
    title: "粒子烟花",
    emoji: "🎆",
    tagline: "升空、炸开、落下",
    blurb: "自动升空绽放，也可点击画面手动放一发。可调频率、散开与重力。",
    hue: "#fb7185",
    params: [
      { key: "rate", label: "频率", min: 0.2, max: 2, step: 0.05, default: 0.7 },
      { key: "spread", label: "散开", min: 0.5, max: 2.2, step: 0.05, default: 1.1 },
      { key: "gravity", label: "重力", min: 0.02, max: 0.25, step: 0.01, default: 0.08 },
    ],
  },
];

export const VIZ_BY_ID = new Map(VIZ_SCENES.map((s) => [s.id, s]));

export function defaultParams(scene: VizSceneMeta): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of scene.params) out[p.key] = p.default;
  return out;
}
