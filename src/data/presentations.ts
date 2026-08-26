import { showcases, type Showcase } from "@/data/showcases";

export type SlideKind = "title" | "bullets" | "metrics" | "steps" | "stack" | "closing";

export type DeckSlide = {
  kind: SlideKind;
  title: string;
  subtitle?: string;
  bullets?: string[];
  metrics?: { label: string; value: string; note?: string }[];
  steps?: { title: string; detail: string }[];
  chips?: string[];
  footer?: string;
};

export type Presentation = {
  slug: string;
  title: string;
  mood: Showcase["mood"];
  emoji: string;
  tagline: string;
  /** Live demo / tool entry when available */
  demoHref?: string;
  github?: string;
  slides: DeckSlide[];
};

type Extra = {
  slug: string;
  title: string;
  mood: Showcase["mood"];
  emoji: string;
  tagline: string;
  demoHref?: string;
  github?: string;
  highlights: string[];
  stack: string[];
  metrics?: { label: string; value: string; note?: string }[];
  steps?: { title: string; detail: string }[];
  closing?: string[];
};

const DEMO_BY_SLUG: Record<string, string> = {
  "smart-water": "/smart-water",
  "hydro-info": "/hydrobench?tab=info",
  hydrobench: "/hydrobench?tab=studio",
  yili: "/yili",
  "novel-studio": "/novel-studio",
  survey: "/survey",
  "graph-rag": "/graph-rag",
  xiangqi: "/xiangqi",
  "temp-files": "/temp-files",
};

const GITHUB_BY_SLUG: Record<string, string> = {
  "hydro-info": "https://github.com/Az0998/hydro-info-platform",
  "hydro-ml": "https://github.com/Az0998/hydro-ml-paper",
  "desktop-pet": "https://github.com/Az0998/zhuangfangyi-desktop-pet",
  "clipboard-viz": "https://github.com/Az0998/clipboard-visualizer",
  yili: "https://github.com/Az0998/yili-divination",
  "novel-studio": "https://github.com/Az0998/novel-studio",
  "graph-rag": "https://github.com/Az0998/deep-learning/tree/master/code/graph-rag-vault",
  xiangqi: "https://github.com/Az0998/deep-learning/tree/master/chess_game",
};

/** Richer narrative overrides for PPT decks (beyond showcase bullets). */
const NARRATIVE: Record<string, { problem: string[]; method: string[]; outcome: string[] }> = {
  "smart-water": {
    problem: [
      "水文岗位需要把巡测考勤、任务、测报和仪器出库收成一套可演示系统",
      "纯态势看板不够，答辩还要看到角色权限与审核闭环",
      "农场类课程设计可复用，但业务对象必须换成测站与防汛物资",
    ],
    method: [
      "前后端分离：Vue + Element 前台 / 管理端，SpringBoot + MyBatis-Plus 后端",
      "模块映射：采收→测报，农具→仪器，农资→防汛物资",
      "在线演示走本机存储；本地可切 MySQL 真库",
    ],
    outcome: [
      "巡测员与管理员两套工作台可当场演示",
      "考勤日历、测报登记、借用审核与库存预警齐全",
      "可作为课程设计 / 实习项目的完整管理系统",
    ],
  },
  "hydro-ml": {
    problem: [
      "多时效径流预报要同时扛住基流与洪峰，单模型很难全面领先",
      "上游站与气象驱动的信息贡献需要可量化消融，而不是口头假设",
      "投稿要求指标、插图、文稿可复现，实验与写作必须同流水线",
    ],
    method: [
      "USGS 日流量 + Open-Meteo 气象 + 上游站拼成长表",
      "统一框架对比 Persistence / ARIMA / XGBoost / LSTM / LSTM-Attention",
      "上游消融、洪水 CSI、QPF 阶梯与迁移学习试验",
    ],
    outcome: [
      "LSTM-Attention 一日 NSE 0.930，显著优于 Persistence 基线",
      "三日尺度 LSTM 仍具竞争力；指标 JSON 与 HSJ 文稿可一键产出",
      "本页为答辩/汇报级演示；完整训练在本地 GPU 复现",
    ],
  },
  "desktop-pet": {
    problem: [
      "桌面陪伴向作品需要「真悬浮」而不是普通窗口感",
      "二次元角色要有站立/互动/空闲等多套序列帧",
      "配置与托盘驻留决定日常可用性",
    ],
    method: [
      "PyQt5 无边框透明置顶窗口 + 系统托盘",
      "idle / walk / wave / happy / sleepy 序列帧状态机",
      "config.json 记录尺寸、位置、语速与空闲行为",
    ],
    outcome: [
      "点击挥手 + 随机台词气泡，拖拽安放可记忆",
      "空闲自动打瞌睡，托盘双击唤回",
      "适合展示交互设计与桌面端工程细节（本地运行）",
    ],
  },
  "clipboard-viz": {
    problem: [
      "复制历史分散，难以复盘「今天复制了什么」",
      "文本/图片/路径/URL 需要自动分类入库",
      "统计看板要比单纯日志更有决策价值",
    ],
    method: [
      "0.5s 轮询监听剪贴板，图片落盘 PNG",
      "SQLAlchemy + SQLite 全量历史",
      "Flask + ECharts：卡片、趋势、饼图、可搜索表",
    ],
    outcome: [
      "本地看板一眼看到类别分布与今日增量",
      "支持详情、回写剪贴板与 CSV 导出",
      "本页汇报产品逻辑；运行态需本机启动 Flask",
    ],
  },
  "plant-ppt": {
    problem: [
      "课程汇报需要统一学术视觉，而不是零散截图拼贴",
      "跨场景叶片形态要同时讲清结构与生态功能",
    ],
    method: [
      "python-pptx 程序化排版：封面 → 场景 → 形态表 → 总结",
      "深林绿 × 奶油学术配色，表格与图注规范统一",
      "覆盖森林、土楼、玉米、松针、银杏、凤梨科等场景",
    ],
    outcome: [
      "一键生成可上台放映的 PPTX",
      "本站提供网页版同源叙事幻灯，便于在线翻阅",
    ],
  },
  "eco-hydro": {
    problem: [
      "植被与水文常被分开讲，缺一张「气候—水分—植被」总图",
      "课程论文需要可复现的数据—指标—图件链路",
    ],
    method: [
      "Budyko 水均衡框架刻画干湿与水分利用",
      "整合 USGS 径流、Open-Meteo 降水/PET 与 NDVI",
      "输出统计表、分析图与答辩演示结构",
    ],
    outcome: [
      "把生态水文耦合讲成一条清晰故事线",
      "适合课程答辩与方法学展示",
    ],
  },
  "hydrology-field": {
    problem: [
      "野外测次、断面、洪水流量往往停在 Excel 碎片",
      "实习报告需要过程线、断面图、绳套曲线三类硬图",
    ],
    method: [
      "日水位频率/历时处理；全站仪大断面 → CSV/Excel/DXF/SWS",
      "绳套法洪水流量与水位流量关系延长",
      "脚本批量清洗，对齐兰州大学综合实习报告",
    ],
    outcome: [
      "采集 → 整编 → 图表/CAD/报告 闭环可演示",
      "三图叙事：水位过程 · 大断面 · Z–Q 绳套",
    ],
  },
  "yaohe-review": {
    problem: [
      "综述既要自然地理背景，也要水资源与经济社会衔接",
      "需要兰大格式文稿 + 可引用的流域示意图",
    ],
    method: [
      "中英标题与学位论文式章节骨架",
      "python-docx + matplotlib 自动流域示意",
      "串联自然背景 → 水文气象 → 人水关系",
    ],
    outcome: [
      "展示文献梳理、结构写作与图文编排能力",
      "本页为在线汇报版，完整文稿可本地生成",
    ],
  },
};

const EXTRAS: Extra[] = [
  {
    slug: "xiangqi",
    title: "中国象棋 · AlphaZero 策略网",
    mood: "tool",
    emoji: "♟️",
    tagline: "自对弈 + MCTS 训练，浏览器 ONNX 即可对弈",
    demoHref: "/xiangqi",
    github: GITHUB_BY_SLUG.xiangqi,
    highlights: [
      "PUCT-MCTS 自对弈 → ResNet 训练 → 版本对抗晋升",
      "策略网导出 ONNX，挂载个人站 /xiangqi",
      "规则引擎含将帅对面、炮架、蹩马腿等",
      "浏览器端轻量 argmax；完整 MCTS 在本地 CUDA",
    ],
    stack: ["PyTorch", "MCTS", "ONNX Runtime Web", "Next.js"],
    steps: [
      { title: "打开演示", detail: "作品卡片进入 /xiangqi，红方点选走子。" },
      { title: "提示着法", detail: "点「提示」查看网络建议。" },
      { title: "本地训练", detail: "python -m ai.loop 自对弈晋升，再 export_onnx。" },
    ],
    closing: ["在线可体验对弈手感", "训练闭环适合展示深度学习工程能力"],
  },
  {
    slug: "graph-rag",
    title: "Graph-RAG Vault · 知识图谱检索",
    mood: "tool",
    emoji: "🕸️",
    tagline: "双向链接笔记 × 种子检索 × 邻居扩展",
    demoHref: "/graph-rag",
    github: GITHUB_BY_SLUG["graph-rag"],
    highlights: [
      "Obsidian 式原子笔记 + 关系图",
      "TF-IDF 种子检索后 1-hop 邻居扩展",
      "Graph-RAG / 纯向量一键对比",
      "浏览器内完成，无需后端",
    ],
    stack: ["TF-IDF", "Force Graph", "Markdown", "Next.js 挂载"],
    steps: [
      { title: "提问检索", detail: "输入问题，观察种子与邻居高亮。" },
      { title: "模式对比", detail: "切换 Graph-RAG 与纯向量看引用差异。" },
      { title: "出处卡片", detail: "查看分数与「经由」路径。" },
    ],
    closing: ["适合展示 RAG + 知识图谱融合思路", "演示数据可在浏览器直接玩"],
  },
  {
    slug: "temp-files",
    title: "临时文件柜 · 到期自毁分享",
    mood: "tool",
    emoji: "🗄️",
    tagline: "上传 · 分享链接 · TTL 到期自动消失",
    demoHref: "/temp-files",
    highlights: [
      "单文件 20MB；1 小时～7 天可选 TTL",
      "分享页 + 删除令牌",
      "元数据 SQLite；文件走 Cloudflare R2 预签名直传",
      "主导航可直达，适合临时交接",
    ],
    stack: ["Next.js", "Prisma", "R2 / 本地磁盘", "预签名上传"],
    steps: [
      { title: "拖拽上传", detail: "选择有效期，拿到分享码。" },
      { title: "打开分享页", detail: "/temp-files/<code> 下载或删除。" },
      { title: "到期清理", detail: "过期自动不可用，减少残留。" },
    ],
    closing: ["轻量工具向作品", "展示全栈上传与对象存储接入"],
  },
  {
    slug: "ocean-do",
    title: "东海陆架溶解氧中长期预报",
    mood: "paper",
    emoji: "🌊",
    tagline: "1–3 个月溶解氧预报 · 稀疏观测压力 · ST-Transformer",
    demoHref: "https://az0998.github.io/ocean-do-forecast/",
    github: "https://github.com/Az0998/ocean-do-forecast",
    highlights: [
      "东海陆架冻结区域，面向中长期预见期而非全球氧场重建",
      "ST-Transformer + 气候态混合，对比 Persistence / Clim / LSTM",
      "station / point / block 稀疏观测压力测试",
      "GitHub Pages 项目页展示多 lead 表与复现命令",
    ],
    stack: ["PyTorch", "ST-Transformer", "WOA18", "稀疏压力测试"],
    metrics: [
      { label: "Lead-1 ST RMSE", value: "3.84" },
      { label: "Skill", value: "0.78" },
      { label: "缺氧 F1", value: "0.74", note: "WOA-informed" },
    ],
    steps: [
      { title: "打开项目页", detail: "浏览图板、多 lead 表与复现命令。" },
      { title: "本地冒烟", detail: "bootstrap_and_smoke → run_multilead --demo。" },
      { title: "读压力测试", detail: "对比稀疏掩膜下预见期技能变化。" },
    ],
    closing: ["适合海洋 AI / 环境预报方向答辩叙事", "完整训练与结果在仓库与 Pages 项目页"],
  },
];

function buildFromShowcase(s: Showcase): Presentation {
  const narrative = NARRATIVE[s.slug];
  const slides: DeckSlide[] = [
    {
      kind: "title",
      title: s.title,
      subtitle: s.tagline,
      footer: "项目介绍汇报 · 翻页或按 → 继续",
    },
    {
      kind: "bullets",
      title: "为什么做",
      subtitle: "问题与动机",
      bullets: narrative?.problem ?? [
        "把可复现能力收成可展示成果",
        "让评审/同学不用装环境也能听懂价值",
        "用统一叙事连接数据、方法与产出",
      ],
    },
    {
      kind: "bullets",
      title: "亮点速览",
      bullets: s.highlights,
    },
  ];

  if (narrative?.method) {
    slides.push({
      kind: "bullets",
      title: "怎么做",
      subtitle: "方法与流水线",
      bullets: narrative.method,
    });
  }

  if (s.metrics?.length) {
    slides.push({
      kind: "metrics",
      title: "关键指标",
      metrics: s.metrics.map((m) => ({
        label: m.label,
        value: m.display,
        note: m.note,
      })),
    });
  }

  if (s.demo?.length) {
    slides.push({
      kind: "steps",
      title: "演示 / 复现路径",
      steps: s.demo,
    });
  }

  slides.push({
    kind: "stack",
    title: "技术栈",
    chips: s.stack,
    bullets: s.galleryHints?.map((g) => `视觉锚点：${g}`),
  });

  slides.push({
    kind: "closing",
    title: "小结与下一步",
    bullets: narrative?.outcome ?? [
      "以上为项目核心叙事与可核对能力边界",
      DEMO_BY_SLUG[s.slug] ? "可继续打开在线演示深入体验" : "完整代码/文稿可在本地复现",
      "欢迎提问指标、数据或部署细节",
    ],
    footer: DEMO_BY_SLUG[s.slug] ? "可进入在线演示" : "感谢聆听",
  });

  return {
    slug: s.slug,
    title: s.title,
    mood: s.mood,
    emoji: s.heroEmoji,
    tagline: s.tagline,
    demoHref: DEMO_BY_SLUG[s.slug],
    github: GITHUB_BY_SLUG[s.slug],
    slides,
  };
}

function buildFromExtra(e: Extra): Presentation {
  const slides: DeckSlide[] = [
    {
      kind: "title",
      title: e.title,
      subtitle: e.tagline,
      footer: "项目介绍汇报 · 翻页或按 → 继续",
    },
    {
      kind: "bullets",
      title: "亮点速览",
      bullets: e.highlights,
    },
  ];
  if (e.metrics?.length) {
    slides.push({ kind: "metrics", title: "关键指标", metrics: e.metrics });
  }
  if (e.steps?.length) {
    slides.push({ kind: "steps", title: "体验路径", steps: e.steps });
  }
  slides.push({ kind: "stack", title: "技术栈", chips: e.stack });
  slides.push({
    kind: "closing",
    title: "小结",
    bullets: e.closing ?? ["可继续打开在线演示或查看源码"],
    footer: e.demoHref ? "可进入在线演示" : "感谢聆听",
  });
  return {
    slug: e.slug,
    title: e.title,
    mood: e.mood,
    emoji: e.emoji,
    tagline: e.tagline,
    demoHref: e.demoHref,
    github: e.github,
    slides,
  };
}

const fromShowcases = showcases.map(buildFromShowcase);
const fromExtras = EXTRAS.map(buildFromExtra);

export const presentations: Presentation[] = [...fromShowcases, ...fromExtras];

const bySlug = new Map(presentations.map((p) => [p.slug, p]));
const byTitle = new Map(presentations.map((p) => [p.title, p]));

export function getPresentation(slug: string): Presentation | undefined {
  return bySlug.get(slug);
}

export function getPresentationByTitle(title: string): Presentation | undefined {
  return byTitle.get(title);
}

export function presentationHrefForTitle(title: string): string | null {
  const p = byTitle.get(title);
  return p ? `/presentations/${p.slug}` : null;
}

export function allPresentationSlugs(): string[] {
  return presentations.map((p) => p.slug);
}
