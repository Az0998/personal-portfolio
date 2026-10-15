export type LabWing = {
  id: string;
  href: string;
  title: string;
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
    title: "作品展厅",
    kicker: "浏览项目",
    tagline: "用轨道、地图、展柜三种方式看作品",
    blurb:
      "把站点项目摊开成可逛的展厅。可按主题筛选，点进在线演示或项目介绍页。",
    hue: "#c4b5fd",
    count: 1,
    samples: [
      { label: "轨道浏览", href: "/atlas?view=orbit" },
      { label: "地图浏览", href: "/atlas?view=stars" },
      { label: "展柜列表", href: "/atlas?view=cabinet" },
    ],
    tech: ["项目导航", "筛选检索", "演示入口"],
  },
  {
    id: "viz",
    href: "/viz-lab",
    title: "平面动画",
    kicker: "18 个可调场景",
    tagline: "从降雨过程到斑图、布料与烟花",
    blurb:
      "浏览器里即时演算的二维动画：水利过程线、流体波纹、生长图案、柔软布料与粒子烟花，参数可边看边调。",
    hue: "#e44c65",
    count: 18,
    samples: [
      { label: "降雨过程", href: "/viz-lab?scene=hydrograph" },
      { label: "斑图生长", href: "/viz-lab?scene=reaction" },
      { label: "柔软布料", href: "/viz-lab?scene=cloth" },
      { label: "粒子烟花", href: "/viz-lab?scene=fireworks" },
    ],
    tech: ["即时演算", "可调参数", "键盘切换"],
  },
  {
    id: "phys",
    href: "/physics-3d",
    title: "三维物理",
    kicker: "8 个可玩场景",
    tagline: "碰撞、水面、绳链与喷泉",
    blurb:
      "可旋转的三维刚体世界：球堆碰撞、斜面滑动、水面浮力、绳链摆动、磁力汇聚与粒子喷泉。拖拽转视角，沙盒可点击生成物体。",
    hue: "#2ec4b6",
    count: 8,
    samples: [
      { label: "水面浮力", href: "/physics-3d?scene=water" },
      { label: "绳链摆动", href: "/physics-3d?scene=chain" },
      { label: "磁力汇聚", href: "/physics-3d?scene=magnet" },
      { label: "粒子喷泉", href: "/physics-3d?scene=fountain" },
    ],
    tech: ["三维渲染", "刚体物理", "实时阴影"],
  },
];

export const LAB_HIGHLIGHTS = [
  {
    title: "斑图生长",
    href: "/viz-lab?scene=reaction",
    hue: "#f472b6",
    note: "图案会自己蔓延，点击画面可投种",
  },
  {
    title: "柔软布料",
    href: "/viz-lab?scene=cloth",
    hue: "#fda4af",
    note: "按住拖拽，布料会随之扯动下垂",
  },
  {
    title: "液态熔球",
    href: "/viz-lab?scene=metaballs",
    hue: "#67e8f9",
    note: "球体靠近时轮廓会融化合并",
  },
  {
    title: "绳链摆动",
    href: "/physics-3d?scene=chain",
    hue: "#fbbf24",
    note: "一串珠子连成绳，末端受冲击后晃动",
  },
  {
    title: "磁力汇聚",
    href: "/physics-3d?scene=magnet",
    hue: "#f87171",
    note: "外围小球被中心吸引，可调磁力强弱",
  },
  {
    title: "粒子喷泉",
    href: "/physics-3d?scene=fountain",
    hue: "#38bdf8",
    note: "连续上抛小球，落地弹跳后自动消失",
  },
];
