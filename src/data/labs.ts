export type LabWing = {
  id: string;
  href: string;
  title: string;
  emoji: string;
  kicker: string;
  tagline: string;
  blurb: string;
  hue: string;
  count: number;
  samples: { label: string; href: string }[];
  tech: string[];
};

export const LAB_WINGS: LabWing[] = [
  {
    id: "atlas",
    href: "/atlas",
    title: "作品星图",
    emoji: "🌌",
    kicker: "Orbit · StarMap · Mood",
    tagline: "把项目摊开成可逛的展馆",
    blurb:
      "CSS 三维星轨、二维星图与展柜三种看法。按展厅 / 链路筛选，一键进入演示或汇报页。",
    hue: "#c4b5fd",
    count: 1,
    samples: [
      { label: "打开星轨", href: "/atlas?view=orbit" },
      { label: "打开星图", href: "/atlas?view=map" },
    ],
    tech: ["CSS 3D", "Canvas", "Framer Motion"],
  },
  {
    id: "viz",
    href: "/viz-lab",
    title: "可视化实验室",
    emoji: "✨",
    kicker: "Canvas 2D · 18 scenes",
    tagline: "机械、混沌、分形到烟花",
    blurb:
      "活塞机构、洛伦兹、光电脉冲、流体波纹、鸟群、Julia、反应扩散、L-system、柔体布、Metaball 与烟花——全部可调参。",
    hue: "#e44c65",
    count: 18,
    samples: [
      { label: "反应扩散", href: "/viz-lab?scene=reaction" },
      { label: "柔体布", href: "/viz-lab?scene=cloth" },
      { label: "烟花", href: "/viz-lab?scene=fireworks" },
      { label: "Julia", href: "/viz-lab?scene=julia" },
    ],
    tech: ["Canvas 2D", "Verlet", "Gray-Scott"],
  },
  {
    id: "phys",
    href: "/physics-3d",
    title: "三维物理实验室",
    emoji: "🎱",
    kicker: "Three.js · Cannon-es · 8 scenes",
    tagline: "碰撞、浮力、绳链与喷泉",
    blurb:
      "刚体堆叠、斜面摩擦、水面浮力、多米诺、绳链约束、磁力吸引、粒子喷泉与点击沙盒。拖拽旋转视角。",
    hue: "#2ec4b6",
    count: 8,
    samples: [
      { label: "绳链", href: "/physics-3d?scene=chain" },
      { label: "磁力", href: "/physics-3d?scene=magnet" },
      { label: "喷泉", href: "/physics-3d?scene=fountain" },
      { label: "浮力", href: "/physics-3d?scene=water" },
    ],
    tech: ["Three.js", "Cannon-es", "阴影渲染"],
  },
];

export const LAB_HIGHLIGHTS = [
  {
    title: "反应扩散斑图",
    href: "/viz-lab?scene=reaction",
    hue: "#f472b6",
    note: "Gray-Scott 图灵纹，点击投种",
  },
  {
    title: "Verlet 柔体布",
    href: "/viz-lab?scene=cloth",
    hue: "#fda4af",
    note: "拖拽扯动，质点弹簧约束",
  },
  {
    title: "Metaball 熔球",
    href: "/viz-lab?scene=metaballs",
    hue: "#67e8f9",
    note: "隐式曲面融合液态轮廓",
  },
  {
    title: "绳链摆动",
    href: "/physics-3d?scene=chain",
    hue: "#fbbf24",
    note: "距离约束多节刚体",
  },
  {
    title: "磁力吸引",
    href: "/physics-3d?scene=magnet",
    hue: "#f87171",
    note: "中心吸力 + 轨道初速",
  },
  {
    title: "粒子喷泉",
    href: "/physics-3d?scene=fountain",
    hue: "#38bdf8",
    note: "连续喷射与寿命回收",
  },
];
