import { showcases, type Showcase } from "@/data/showcases";
import { presentationHrefForTitle } from "@/data/presentations";

export type AtlasHall = "hydro" | "demo" | "paper" | "tool" | "design";

export type AtlasExhibit = {
  slug: string;
  title: string;
  emoji: string;
  mood: Showcase["mood"];
  hall: AtlasHall;
  tagline: string;
  href?: string;
  deckHref: string | null;
  github?: string;
  highlights: string[];
  stack: string[];
  metrics: { label: string; display: string; value: number }[];
  demo: { title: string; detail: string }[];
  featured: boolean;
  story?: AtlasStory;
  color: string;
};

export type AtlasStory = "采集" | "空间" | "态势" | "预报" | "文档" | "创作";

export const HALLS: { id: AtlasHall | "all"; label: string }[] = [
  { id: "all", label: "全部展厅" },
  { id: "hydro", label: "智慧水利" },
  { id: "demo", label: "在线演示" },
  { id: "paper", label: "论文研究" },
  { id: "tool", label: "工具应用" },
  { id: "design", label: "设计创作" },
];

export const STORIES: { id: AtlasStory | "all"; label: string; hint: string }[] = [
  { id: "all", label: "全链路", hint: "采集 → 空间 → 态势 → 预报 → 文档" },
  { id: "采集", label: "采集", hint: "测次、断面、监听入库" },
  { id: "空间", label: "空间", hint: "流域落点与一张图" },
  { id: "态势", label: "态势", hint: "站网、CSI、业务系统" },
  { id: "预报", label: "预报", hint: "机理与数据驱动" },
  { id: "文档", label: "文档", hint: "论证草稿与综述" },
  { id: "创作", label: "创作", hint: "写作、占筮、同人、桌宠" },
];

export const HYDRO_CHAIN: AtlasStory[] = ["采集", "空间", "态势", "预报", "文档"];

const MOOD_COLOR: Record<Showcase["mood"], string> = {
  hydro: "#2ec4b6",
  field: "#f4a261",
  novel: "#e8c9a8",
  tool: "#7bdff2",
  pet: "#e44c65",
  plant: "#9ccc65",
  paper: "#f0c14a",
};

const HALL_BY_MOOD: Record<Showcase["mood"], AtlasHall> = {
  hydro: "hydro",
  field: "hydro",
  paper: "paper",
  novel: "demo",
  tool: "tool",
  pet: "design",
  plant: "design",
};

const HREF: Record<string, string> = {
  "water-balance-report": "/water-balance-report",
  "smart-water": "/smart-water",
  "hydro-info": "/hydrobench?tab=info",
  hydrobench: "/hydrobench",
  yili: "/yili",
  "novel-studio": "/novel-studio",
  survey: "/survey",
  "graph-rag": "/graph-rag",
  xiangqi: "/xiangqi",
  "temp-files": "/temp-files",
  "cs-life": "/cs-life",
  "xaj-bench": "/xaj-bench",
  "watershed-map": "/watershed-map",
  "life-sim": "/life-sim",
  "ocean-do": "https://az0998.github.io/ocean-do-forecast/",
  "viz-lab": "/viz-lab",
  "physics-3d": "/physics-3d",
};

const GITHUB: Record<string, string> = {
  "hydro-info": "https://github.com/Az0998/hydro-info-platform",
  "hydro-ml": "https://github.com/Az0998/hydro-ml-paper",
  "desktop-pet": "https://github.com/Az0998/zhuangfangyi-desktop-pet",
  "clipboard-viz": "https://github.com/Az0998/clipboard-visualizer",
  yili: "https://github.com/Az0998/yili-divination",
  "novel-studio": "https://github.com/Az0998/novel-studio",
  "graph-rag": "https://github.com/Az0998/deep-learning/tree/master/code/graph-rag-vault",
  xiangqi: "https://github.com/Az0998/deep-learning/tree/master/chess_game",
  "ocean-do": "https://github.com/Az0998/ocean-do-forecast",
};

const STORY_BY_SLUG: Record<string, AtlasStory> = {
  "hydrology-field": "采集",
  "clipboard-viz": "采集",
  "watershed-map": "空间",
  "hydro-info": "态势",
  "smart-water": "态势",
  hydrobench: "态势",
  "hydro-ml": "预报",
  "xaj-bench": "预报",
  "ocean-do": "预报",
  "eco-hydro": "预报",
  "water-balance-report": "文档",
  "yaohe-review": "文档",
  "plant-ppt": "文档",
  yili: "创作",
  "novel-studio": "创作",
  "desktop-pet": "创作",
  "cs-life": "创作",
  "life-sim": "创作",
  survey: "创作",
  xiangqi: "创作",
};

const FEATURED = new Set([
  "hydro-info",
  "hydrobench",
  "water-balance-report",
  "hydro-ml",
  "watershed-map",
  "xaj-bench",
]);

type Extra = Omit<AtlasExhibit, "deckHref" | "color" | "featured" | "metrics"> & {
  metrics?: AtlasExhibit["metrics"];
};

const EXTRAS: Extra[] = [
  {
    slug: "xaj-bench",
    title: "新安江机理预报对照台",
    emoji: "⛰️",
    mood: "hydro",
    hall: "hydro",
    tagline: "日降水 → 产汇流 → 出口流量，同口径 NSE 对照数据驱动",
    href: "/xaj-bench",
    github: undefined,
    highlights: [
      "浏览器可复现的新安江日模型",
      "与数据驱动基线同口径对照",
      "室内岗叙事：机理先于黑箱",
    ],
    stack: ["TypeScript", "新安江", "NSE", "Next.js"],
    demo: [
      { title: "打开对照台", detail: "载入样本降水，看出口过程线。" },
      { title: "调参", detail: "改张力水容量等，观察 NSE 变化。" },
    ],
    story: "预报",
  },
  {
    slug: "watershed-map",
    title: "流域「一张图」GIS 小站",
    emoji: "🗺️",
    mood: "field",
    hall: "hydro",
    tagline: "图层 · 测距 · 阈值过程线 · 数据谱系可讲清",
    href: "/watershed-map",
    highlights: [
      "Leaflet 流域底图与图层开关",
      "测距与站点过程线",
      "谱系说明：数据从哪来、怎么用",
    ],
    stack: ["Leaflet", "GeoJSON", "Turf", "Next.js"],
    demo: [
      { title: "打开一张图", detail: "切换图层，点选站点。" },
      { title: "测距", detail: "量一段河道或断面距离。" },
    ],
    story: "空间",
  },
  {
    slug: "xiangqi",
    title: "中国象棋 · AlphaZero 策略网",
    emoji: "♟️",
    mood: "tool",
    hall: "demo",
    tagline: "自对弈 + MCTS 训练，浏览器 ONNX 即可对弈",
    href: "/xiangqi",
    github: GITHUB.xiangqi,
    highlights: ["PUCT-MCTS 自对弈晋升", "ONNX 挂载 /xiangqi", "规则引擎含将帅对面与炮架"],
    stack: ["PyTorch", "MCTS", "ONNX", "Next.js"],
    demo: [{ title: "对弈", detail: "红方点选走子，可看网络提示。" }],
    story: "创作",
  },
  {
    slug: "graph-rag",
    title: "Graph-RAG Vault · 知识图谱检索",
    emoji: "🕸️",
    mood: "tool",
    hall: "demo",
    tagline: "双向链接笔记 × 种子检索 × 邻居扩展",
    href: "/graph-rag",
    github: GITHUB["graph-rag"],
    highlights: ["TF-IDF 种子 + 1-hop 邻居", "Graph-RAG 与纯向量对比", "浏览器内完成"],
    stack: ["TF-IDF", "Force Graph", "Next.js"],
    demo: [{ title: "提问", detail: "看种子与邻居高亮路径。" }],
    story: "创作",
  },
  {
    slug: "temp-files",
    title: "临时文件柜 · 到期自毁分享",
    emoji: "🗄️",
    mood: "tool",
    hall: "tool",
    tagline: "上传 · 分享链接 · TTL 到期自动消失",
    href: "/temp-files",
    highlights: ["单文件 20MB，TTL 可选", "分享页 + 删除令牌", "R2 预签名直传"],
    stack: ["Next.js", "Prisma", "R2"],
    demo: [{ title: "拖拽上传", detail: "选有效期，拿到分享码。" }],
  },
  {
    slug: "life-sim",
    title: "人生模拟枢纽 · 多领域转盘",
    emoji: "🎡",
    mood: "tool",
    hall: "demo",
    tagline: "CS / 凡人 / 水职场 / 同人题材风包",
    href: "/life-sim",
    highlights: ["多领域入口", "Softmax 权重与 flag", "本机存档可分享"],
    stack: ["Next.js", "加权随机", "localStorage"],
    demo: [{ title: "选领域", detail: "从枢纽进入一条命运线。" }],
    story: "创作",
  },
  {
    slug: "cs-life",
    title: "CS 人生模拟 · AI 转盘事件",
    emoji: "🎯",
    mood: "tool",
    hall: "demo",
    tagline: "加权转盘 · 六维成长 · 自适应赛季",
    href: "/cs-life",
    highlights: ["开局建档到退役结算", "雷达图与生涯时间线", "示意战队，不爬 HLTV"],
    stack: ["Next.js", "SVG 转盘", "localStorage"],
    metrics: [
      { label: "六维", display: "6", value: 6 },
      { label: "赛季事件", display: "自适应", value: 12 },
    ],
    demo: [{ title: "开转", detail: "从出生地转到六维天赋。" }],
    story: "创作",
  },
  {
    slug: "ocean-do",
    title: "东海陆架溶解氧中长期预报",
    emoji: "🫧",
    mood: "paper",
    hall: "paper",
    tagline: "1–3 个月溶解氧 · 稀疏观测压力 · ST-Transformer",
    href: "https://az0998.github.io/ocean-do-forecast/",
    github: GITHUB["ocean-do"],
    highlights: ["ST-Transformer + 气候态混合", "station / point / block 压力测试", "Pages 项目页"],
    stack: ["PyTorch", "ST-Transformer", "WOA18"],
    metrics: [
      { label: "Lead-1 RMSE", display: "3.84", value: 3.84 },
      { label: "Skill", display: "0.78", value: 0.78 },
    ],
    demo: [{ title: "打开项目页", detail: "看多 lead 表与复现命令。" }],
    story: "预报",
  },
  {
    slug: "labs",
    title: "效果集成馆",
    emoji: "🏛️",
    mood: "tool",
    hall: "demo",
    tagline: "星图 · Canvas 视效 · 三维物理的统一入口",
    href: "/labs",
    highlights: [
      "三翼集成：作品星图 / 2D 视效 / 3D 物理",
      "亮点直达反应扩散、柔体、绳链、喷泉等",
      "能力展厅叙事，不占水利主链精选",
    ],
    stack: ["Next.js", "Canvas 2D", "Three.js"],
    demo: [
      { title: "打开集成馆", detail: "顶栏「实验室」或 /labs。" },
      { title: "进一翼", detail: "从卡片或亮点跳进具体场景。" },
    ],
    story: "创作",
  },
  {
    slug: "viz-lab",
    title: "可视化实验室 · 运动与渲染小品",
    emoji: "✨",
    mood: "tool",
    hall: "demo",
    tagline: "18 场景 · 降雨径流优先 · 反应扩散 / 柔体 / Metaball",
    href: "/viz-lab",
    highlights: [
      "十八个 Canvas 实时场景，可调参数",
      "降雨—单位线优先展示，贴合主链叙事",
      "反应扩散、Verlet 柔体、Metaball、烟花",
    ],
    stack: ["Canvas 2D", "数值积分", "Next.js"],
    demo: [
      { title: "打开实验室", detail: "/labs 或 /viz-lab。" },
      { title: "换场景", detail: "点标签或按 ← → / 1–9。" },
    ],
    story: "创作",
  },
  {
    slug: "physics-3d",
    title: "三维物理实验室",
    emoji: "🧪",
    mood: "tool",
    hall: "demo",
    tagline: "8 场景 · 碰撞浮力 · 绳链磁力 · 粒子喷泉",
    href: "/physics-3d",
    highlights: [
      "Three.js 软阴影 + Cannon 刚体世界",
      "绳链约束、磁力吸引、粒子喷泉",
      "点击沙盒生成球体/方块",
    ],
    stack: ["Three.js", "cannon-es", "Next.js"],
    demo: [
      { title: "打开 3D 物理", detail: "/labs 或 /physics-3d。" },
      { title: "调摩擦/弹性", detail: "看斜面起滑与堆叠回弹变化。" },
    ],
    story: "创作",
  },
];

function fromShowcase(s: Showcase): Extra {
  const hall =
    s.slug === "survey" || s.slug === "yili" || s.slug === "novel-studio"
      ? "demo"
      : HALL_BY_MOOD[s.mood];
  return {
    slug: s.slug,
    title: s.title,
    emoji: s.heroEmoji,
    mood: s.mood,
    hall,
    tagline: s.tagline,
    href: HREF[s.slug],
    github: GITHUB[s.slug],
    highlights: s.highlights,
    stack: s.stack,
    metrics: (s.metrics ?? []).map((m) => ({
      label: m.label,
      display: m.display,
      value: m.value,
    })),
    demo: s.demo ?? [],
    story: STORY_BY_SLUG[s.slug],
  };
}

function finalize(raw: Extra): AtlasExhibit {
  return {
    ...raw,
    deckHref: presentationHrefForTitle(raw.title),
    color: MOOD_COLOR[raw.mood],
    featured: FEATURED.has(raw.slug),
    metrics: raw.metrics ?? [],
    github: raw.github ?? GITHUB[raw.slug],
    href: raw.href ?? HREF[raw.slug],
    story: raw.story ?? STORY_BY_SLUG[raw.slug],
  };
}

const seen = new Set<string>();
/** 有价值优先：主链 featured 在前，再按 hall 叙事 */
const HALL_RANK: Record<AtlasHall, number> = {
  hydro: 0,
  paper: 1,
  tool: 2,
  demo: 3,
  design: 4,
};
export const ATLAS: AtlasExhibit[] = [...showcases.map(fromShowcase), ...EXTRAS]
  .filter((e) => {
    if (seen.has(e.slug)) return false;
    seen.add(e.slug);
    return true;
  })
  .map(finalize)
  .sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const hr = HALL_RANK[a.hall] - HALL_RANK[b.hall];
    if (hr !== 0) return hr;
    return a.title.localeCompare(b.title, "zh");
  });

export const ATLAS_BY_SLUG = new Map(ATLAS.map((e) => [e.slug, e]));

export function relatedExhibits(e: AtlasExhibit, limit = 3) {
  return ATLAS.filter(
    (x) => x.slug !== e.slug && (x.hall === e.hall || (!!e.story && x.story === e.story))
  ).slice(0, limit);
}

export function chainAnchor(story: AtlasStory) {
  return ATLAS.find((e) => e.story === story && e.featured) ?? ATLAS.find((e) => e.story === story);
}

export function atlasStats(list: AtlasExhibit[]) {
  const live = list.filter((e) => e.href).length;
  const decks = list.filter((e) => e.deckHref).length;
  const stacks = new Set(list.flatMap((e) => e.stack)).size;
  return { total: list.length, live, decks, stacks };
}
