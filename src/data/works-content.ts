export type WorkSeed = {
  title: string;
  description: string;
  category: string;
  tags: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  content: string;
  github?: string | null;
  link?: string | null;
};

/** Single source of truth — edit here, then sync / redeploy. */
export const worksContent: WorkSeed[] = [
  {
    title: "波托马克河多时效径流深度学习预报",
    description:
      "多时效径流预报实验闭环：LSTM-Attention 一日 NSE 0.93，含消融、洪水评估与 HSJ 文稿流水线。",
    category: "paper",
    tags: "深度学习,水文,PyTorch,LSTM,XGBoost,HSJ",
    featured: true,
    published: true,
    sortOrder: 1,
    github: "https://github.com/Az0998/personal-portfolio",
    content: `## 一句话

把上游水文站 + 气象场喂给深度学习，做 1/3/7 日流量预报，并用统一指标板把模型打分、消融和投稿图一锅端。

## 你现在能看到什么

- **指标舱**：详情页顶部 NSE 对比条，一眼看出谁在一日/三日赢
- **演示流**：数据 → 训练 → 消融/洪水 → 文稿，四步复现
- **结果表**：LSTM-Attention 一日 NSE **0.930**；三日 LSTM **0.543**

## 方法速览

| 模块 | 做法 |
|------|------|
| 数据 | USGS 日流量 + Open-Meteo 气象 + 上游站 |
| 模型 | Persistence / ARIMA / XGBoost / LSTM / LSTM-Attn |
| 评估 | NSE · KGE · RMSE · MAE · PBIAS · 洪水 CSI |
| 产出 | JSON 指标、插图脚本、HSJ 风格稿件 |

## 本地跑一遍

\`\`\`bash
cd hydro-ml-paper
pip install -r requirements.txt
python download_data.py
python run_experiment.py
python run_ablation.py
\`\`\`

## 进展同步

本站作品文案以仓库 \`src/data/works-content.ts\` 为准；你推 GitHub → Render 自动部署 → 构建时同步更新介绍。
`,
  },
  {
    title: "庄方宜 Q 版桌面宠物",
    description:
      "终末地麒麟天师桌宠：透明置顶、多套动画、点击台词与托盘常驻，二次元陪伴向作品。",
    category: "code",
    tags: "PyQt5,桌面宠物,二次元,动画,庄方宜",
    featured: true,
    published: true,
    sortOrder: 2,
    content: `## 一句话

让角色住进桌面——无边框透明、始终置顶，写代码时点一下还会跟你打招呼。

## 演示看点

1. 启动后悬浮窗口贴在屏幕角落  
2. 单击挥手 + 随机台词气泡  
3. 拖拽安放；空闲自动打瞌睡  
4. 托盘驻留，双击唤回  

## 功能表

| 能力 | 说明 |
|------|------|
| 动画 | idle / walk / wave / happy / sleepy |
| 互动 | 点击、拖拽、右键菜单 |
| 配置 | \`config.json\` 调尺寸、坐标、台词 |

## 本地演示

\`\`\`bash
cd zhuangfangyi-desktop-pet
pip install -r requirements.txt
python generate_placeholders.py
python main.py
\`\`\`
`,
  },
  {
    title: "剪贴板智能可视化仪表板",
    description:
      "监听剪贴板 → 自动分类入库 → Flask + ECharts 看板，把每一次复制变成可检索数据。",
    category: "project",
    tags: "Flask,ECharts,SQLite,可视化,工具",
    featured: true,
    published: true,
    sortOrder: 3,
    content: `## 一句话

后台默默记下你复制的文字、图片、路径和链接，再用仪表板把习惯可视化。

## 三分钟体验

\`\`\`bash
cd clipboard-visualizer
pip install -r requirements.txt
python app.py
\`\`\`

打开 http://127.0.0.1:5000 ，随便复制几段内容，看统计卡片和饼图跳动。

## 能力清单

- 0.5s 轮询监听  
- 文本 / 图片 / 路径 / URL 分类  
- 趋势图 · 饼图 · 搜索分页 · CSV 导出  
`,
  },
  {
    title: "植物叶片形态分析演示文稿",
    description:
      "python-pptx 一键生成学术风叶片形态 PPT：跨场景观察 + 形态表 + 生态解释。",
    category: "design",
    tags: "python-pptx,植物,生态,课程汇报",
    featured: true,
    published: true,
    sortOrder: 4,
    content: `## 一句话

深林绿学术配色，把多场景叶片观察自动排成能上台讲的 PPT。

## 怎么出片

\`\`\`bash
python create_plant_ppt.py
\`\`\`

生成后直接放映：封面 → 场景分析 → 形态对照 → 总结。
`,
  },
  {
    title: "波托马克流域生态水文耦合分析",
    description:
      "Budyko 框架下的植被—水文耦合：径流、降水、PET 与 NDVI 一体化分析流水线。",
    category: "project",
    tags: "生态水文,Budyko,NDVI,课程论文",
    featured: false,
    published: true,
    sortOrder: 5,
    content: `## 一句话

用 Budyko 把气候干湿、径流和 NDVI 放进同一套故事，适合课程论文与答辩展示。

## 流水线

1. 拉取 USGS / Open-Meteo 数据  
2. 算干旱指数与水分利用相关量  
3. 关联 NDVI，出图出表出 PPT  
`,
  },
  {
    title: "水文测验与资料整编实践合集",
    description:
      "水位过程、大断面 DXF、绳套洪水流量、评级延长——野外数据到报表的整编合集。",
    category: "project",
    tags: "水文测验,断面,水位流量,实习",
    featured: false,
    published: true,
    sortOrder: 6,
    content: `## 一句话

把多个实习模块串成「采集 → 脚本整编 → 图表/CAD/报告」一条链。

## 推荐三图

水位过程线 · 大断面形态 · 绳套 Z–Q 曲线——最能说明你会把野外数据做成可用成果。
`,
  },
  {
    title: "洮河与黄河水文地理综述",
    description:
      "洮河—黄河自然地理与水资源经济社会综述，配套流域示意与兰大格式文稿。",
    category: "paper",
    tags: "综述,洮河,黄河,兰州大学",
    featured: false,
    published: true,
    sortOrder: 7,
    content: `## 一句话

结构化综述写作 + 流域示意图，展示文献梳理与图文编排能力。
`,
  },
  {
    title: "Novel Studio 写作工作台",
    description:
      "个人向连载助手：大纲到章节流水线、质量门禁与桌面端打包（强调本地创作辅助）。",
    category: "project",
    tags: "LLM,写作工具,桌面应用",
    featured: false,
    published: true,
    sortOrder: 8,
    content: `## 一句话

本地管理多书目，走完「种子 → 大纲 → 章节 → 质检」循环，给长期写作降摩擦。

## 演示重点

建书目 → 扩大纲 → 章节质量分门禁。公开展示定位为个人写作辅助。
`,
  },
];

export const profileContent = {
  name: "张森捷",
  title: "水文 · 机器学习 · 二次元创作者",
  tagline: "用模型读懂河流，用代码留下一点动漫浪漫",
  bio: "兰州大学水文与水资源工程方向。白天和流量、Budyko、LSTM 较劲；晚上给桌面养一只麒麟天师，顺便把剪贴板和写作流水线做成工具。\n\n作品介绍以仓库数据源自动同步：你改本地/GitHub 里的作品文案并推送后，站点会在部署时更新——不用在后台逐条手工填进展。",
  email: "your.email@example.com",
  location: "兰州 / 中国",
  github: "https://github.com/Az0998",
  website: "https://zhangsjqaq.vexr.dev",
};
