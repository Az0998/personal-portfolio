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
    title: "活塞连杆机构",
    emoji: "⚙️",
    tagline: "曲柄 · 连杆 · 活塞往复 · 示功曲线",
    blurb: "经典曲柄滑块：曲柄匀速转动带动活塞往复。右侧叠画位移曲线，可调转速与曲柄半径。",
    hue: "#f4a261",
    params: [
      { key: "rpm", label: "转速", min: 20, max: 180, step: 1, default: 72 },
      { key: "crank", label: "曲柄半径", min: 28, max: 72, step: 1, default: 48 },
      { key: "rod", label: "连杆长度", min: 90, max: 180, step: 1, default: 130 },
    ],
  },
  {
    id: "chaos",
    title: "洛伦兹混沌",
    emoji: "🌀",
    tagline: "奇异吸引子 · 对初值敏感 · 轨迹彩带",
    blurb: "三维洛伦兹方程组投影到平面。微小初值差会分叉成不同轨迹，可调 σ / ρ / β。",
    hue: "#e44c65",
    params: [
      { key: "sigma", label: "σ", min: 4, max: 20, step: 0.1, default: 10 },
      { key: "rho", label: "ρ", min: 10, max: 40, step: 0.1, default: 28 },
      { key: "beta", label: "β", min: 1, max: 8, step: 0.05, default: 2.67 },
      { key: "trail", label: "拖尾", min: 400, max: 4000, step: 50, default: 1800 },
    ],
  },
  {
    id: "optics",
    title: "光电通信脉冲",
    emoji: "📡",
    tagline: "光纤脉冲 · 调制波形 · 误码示意",
    blurb: "发送端比特流调制成光脉冲，沿光纤传播并叠加色散噪声；接收端判决恢复码字。",
    hue: "#7bdff2",
    params: [
      { key: "bitrate", label: "比特率", min: 2, max: 16, step: 1, default: 8 },
      { key: "noise", label: "噪声", min: 0, max: 0.55, step: 0.01, default: 0.12 },
      { key: "dispersion", label: "色散", min: 0, max: 1, step: 0.01, default: 0.35 },
    ],
  },
  {
    id: "fluid",
    title: "彩色水流波纹",
    emoji: "💧",
    tagline: "点击起波 · 墨染混色 · 流动场",
    blurb: "简化流体场：随机色墨滴落入流动网格，点击可激起波纹。适合看颜色如何被卷吸混合。",
    hue: "#2ec4b6",
    params: [
      { key: "viscosity", label: "粘滞", min: 0.86, max: 0.99, step: 0.005, default: 0.94 },
      { key: "spawn", label: "滴落频率", min: 0.01, max: 0.2, step: 0.01, default: 0.06 },
      { key: "swirl", label: "涡旋", min: 0.2, max: 2.2, step: 0.05, default: 1 },
    ],
  },
  {
    id: "rays",
    title: "光线追踪小品",
    emoji: "🔦",
    tagline: "镜面反射 · 折射 · 焦散暗示",
    blurb: "二维光线在圆镜与玻璃球间弹跳折射。可调光源角与折射率，观察束线与亮斑。",
    hue: "#f0c14a",
    params: [
      { key: "beams", label: "光线数", min: 12, max: 80, step: 1, default: 36 },
      { key: "ior", label: "折射率", min: 1.05, max: 2.2, step: 0.01, default: 1.45 },
      { key: "angle", label: "光源角", min: -50, max: 50, step: 1, default: -12 },
    ],
  },
  {
    id: "cosmos",
    title: "星空天文场",
    emoji: "🌌",
    tagline: "恒星视差 · 行星轨道 · 银河带",
    blurb: "缓慢视差星场 + 简化开普勒轨道与彗星尾。拖拽可偏航视角，滚轮调缩放感。",
    hue: "#c4b5fd",
    params: [
      { key: "density", label: "星数", min: 80, max: 420, step: 10, default: 220 },
      { key: "speed", label: "公转", min: 0.2, max: 2.5, step: 0.05, default: 1 },
      { key: "milky", label: "银河浓度", min: 0.2, max: 1.4, step: 0.05, default: 0.85 },
    ],
  },
  {
    id: "pendulum",
    title: "双摆混沌",
    emoji: "🕰️",
    tagline: "双摆 · 能量色带 · 对初值敏感",
    blurb: "双摆用 RK4 积分。轨迹按角速度上色，长时运行会铺满相空间的一片区域。",
    hue: "#ff9aab",
    params: [
      { key: "l1", label: "杆1", min: 60, max: 140, step: 1, default: 100 },
      { key: "l2", label: "杆2", min: 50, max: 140, step: 1, default: 90 },
      { key: "g", label: "重力", min: 4, max: 18, step: 0.1, default: 9.8 },
    ],
  },
  {
    id: "aurora",
    title: "极光带渲染",
    emoji: "✨",
    tagline: "磁场带 · 粒子帘 · 色相漂移",
    blurb: "多层正弦帘幕叠加噪声相位，模拟极光沿磁力线起伏。可调带宽、闪烁与色漂。",
    hue: "#34d399",
    params: [
      { key: "bands", label: "层数", min: 2, max: 8, step: 1, default: 5 },
      { key: "flicker", label: "闪烁", min: 0.2, max: 2.5, step: 0.05, default: 1 },
      { key: "hueShift", label: "色漂", min: 0, max: 120, step: 1, default: 40 },
    ],
  },
  {
    id: "epicycles",
    title: "傅里叶周转圆",
    emoji: "🔁",
    tagline: "谐波叠加 · 周转圆 · 轨迹复现",
    blurb: "用一组旋转向量逼近闭合曲线。谐波越多轮廓越贴；是频谱直觉与复平面的直观版。",
    hue: "#fb7185",
    params: [
      { key: "harmonics", label: "谐波数", min: 2, max: 24, step: 1, default: 8 },
      { key: "speed", label: "转速", min: 0.3, max: 2.5, step: 0.05, default: 1 },
      { key: "shape", label: "目标形", min: 0, max: 2, step: 1, default: 0 },
    ],
  },
  {
    id: "boids",
    title: "鸟群涌现",
    emoji: "🕊️",
    tagline: "分离 · 对齐 · 聚合 · 无中心",
    blurb: "经典 Boids：局部规则叠加出整体编队。可调感知半径与三力权重，观察涌现结构。",
    hue: "#38bdf8",
    params: [
      { key: "count", label: "个体", min: 40, max: 180, step: 5, default: 90 },
      { key: "radius", label: "感知半径", min: 20, max: 90, step: 1, default: 42 },
      { key: "cohesion", label: "聚合", min: 0.2, max: 2.5, step: 0.05, default: 1 },
    ],
  },
  {
    id: "julia",
    title: "Julia 分形集",
    emoji: "🧬",
    tagline: "复动力系统 · 逃逸时间 · 可拖参数",
    blurb: "对每个像素迭代 z→z²+c。拖动画布微调 c；改迭代深度可在细节与帧率间权衡。",
    hue: "#a78bfa",
    params: [
      { key: "iter", label: "迭代", min: 20, max: 120, step: 1, default: 55 },
      { key: "zoom", label: "缩放", min: 0.6, max: 2.4, step: 0.05, default: 1.1 },
      { key: "palette", label: "色板", min: 0, max: 2, step: 1, default: 0 },
    ],
  },
  {
    id: "waves",
    title: "波场干涉",
    emoji: "🌊",
    tagline: "双源波 · 相长相消 · 阻尼",
    blurb: "二维波动方程简化版：两个振源叠加出干涉条纹。点击可临时加第三源。",
    hue: "#22d3ee",
    params: [
      { key: "freq", label: "频率", min: 0.4, max: 2.8, step: 0.05, default: 1.2 },
      { key: "damp", label: "阻尼", min: 0.96, max: 0.999, step: 0.001, default: 0.992 },
      { key: "amp", label: "振幅", min: 0.3, max: 2, step: 0.05, default: 1 },
    ],
  },
  {
    id: "hydrograph",
    title: "降雨—径流过程",
    emoji: "🌧️",
    tagline: "雨强 · 单位线 · 出口流量",
    blurb: "示意室内岗叙事：脉冲降雨经单位线卷积得到出口过程线。可调雨峰、滞后与汇流时间。",
    hue: "#2ec4b6",
    params: [
      { key: "peak", label: "雨峰", min: 0.4, max: 2.5, step: 0.05, default: 1.2 },
      { key: "lag", label: "滞后", min: 4, max: 28, step: 1, default: 12 },
      { key: "tp", label: "汇流时", min: 6, max: 36, step: 1, default: 16 },
    ],
  },
  {
    id: "reaction",
    title: "反应扩散斑图",
    emoji: "🧫",
    tagline: "Gray-Scott · 图灵斑 · 生长纹",
    blurb: "经典 Gray-Scott 反应扩散：斑点、条纹等图灵形态。点击可投种；可调扩散与反应速率。",
    hue: "#f472b6",
    params: [
      { key: "feed", label: "Feed", min: 0.02, max: 0.08, step: 0.001, default: 0.037 },
      { key: "kill", label: "Kill", min: 0.04, max: 0.07, step: 0.001, default: 0.06 },
      { key: "speed", label: "演化", min: 1, max: 8, step: 1, default: 3 },
    ],
  },
  {
    id: "lsystem",
    title: "L-system 生长",
    emoji: "🌿",
    tagline: "重写规则 · 分枝 · 季节色",
    blurb: "字符串重写生成植物分枝。调代数与分叉角，看形态从简到繁；带轻微风摆。",
    hue: "#86efac",
    params: [
      { key: "depth", label: "代数", min: 2, max: 6, step: 1, default: 4 },
      { key: "angle", label: "分叉角", min: 12, max: 45, step: 1, default: 25 },
      { key: "wind", label: "风摆", min: 0, max: 1.5, step: 0.05, default: 0.45 },
    ],
  },
  {
    id: "cloth",
    title: "Verlet 柔体布",
    emoji: "🧵",
    tagline: "质点弹簧 · 约束 · 拖拽",
    blurb: "二维布料：Verlet 积分 + 距离约束。按住拖拽可扯动，可调刚度与重力。",
    hue: "#fda4af",
    params: [
      { key: "stiffness", label: "刚度", min: 1, max: 8, step: 1, default: 4 },
      { key: "gravity", label: "重力", min: 0.05, max: 0.6, step: 0.01, default: 0.22 },
      { key: "damping", label: "阻尼", min: 0.96, max: 0.999, step: 0.001, default: 0.99 },
    ],
  },
  {
    id: "metaballs",
    title: "Metaball 熔球",
    emoji: "🫧",
    tagline: "隐式曲面 · 融合 · 色相流动",
    blurb: "势能场等值面形成可融合的液态球。球在场内漂移碰撞感强，适合看软体轮廓。",
    hue: "#67e8f9",
    params: [
      { key: "count", label: "球数", min: 3, max: 10, step: 1, default: 5 },
      { key: "threshold", label: "阈值", min: 0.8, max: 2.2, step: 0.05, default: 1.15 },
      { key: "speed", label: "漂移", min: 0.3, max: 2, step: 0.05, default: 0.9 },
    ],
  },
  {
    id: "fireworks",
    title: "烟花粒子",
    emoji: "🎆",
    tagline: "爆发 · 拖尾 · 重力落尘",
    blurb: "定时升空爆炸成彩屑，带拖尾与重力。点击也可手动放一发；偏视觉设计向。",
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
