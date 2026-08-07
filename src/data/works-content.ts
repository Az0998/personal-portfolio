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
    title: "中国象棋 · AlphaZero 策略网",
    description:
      "自对弈 + MCTS 训练的中国象棋策略网络：本地 CUDA 闭环训练，浏览器 ONNX 对弈。挂载 /xiangqi。",
    category: "demo",
    tags: "象棋,AlphaZero,MCTS,ONNX,深度学习,自对弈,前端演示",
    featured: true,
    published: true,
    sortOrder: 8,
    link: "/xiangqi",
    github: "https://github.com/Az0998/deep-learning/tree/master/chess_game",
    content: `## 一句话

中国象棋的 AlphaZero 风格管线：PUCT-MCTS 自对弈生成数据 → 训练 ResNet → 新旧版本对抗晋升；策略网导出 ONNX 后可在浏览器里对弈。

## 在线打开

[打开象棋策略网演示](/xiangqi)

> 不在顶栏占位，从本作品详情进入即可。浏览器端用 policy argmax（轻量）；完整 MCTS 在本地 Python。

## 能体验什么

- 红方点选走子，黑方由 ONNX 策略网应着
- **提示**按钮查看网络建议着法
- 规则引擎含将帅对面、炮架、蹩马腿等

## 本地训练（Python / CUDA）

\`\`\`bash
cd chess_game
pip install -r requirements.txt
python -m ai.loop --gens 2 --games 50 --sims 100
python scripts/export_onnx.py
python main.py
\`\`\`

按 \`A\` 在 NeuralMCTS 与 Minimax 基线之间切换。
`,
  },
  {
    title: "匿名问卷 · 分发填写与汇总",
    description:
      "浏览器端匿名问卷：公开/私密分发、填写汇总、结果快照，以及问卷绑定的匿名讨论区。挂载 /survey。",
    category: "demo",
    tags: "问卷,匿名,讨论,前端,localStorage,工具,演示",
    featured: true,
    published: true,
    sortOrder: 10,
    link: "/survey",
    content: `## 一句话

在浏览器里完成「创建 → 分发 → 匿名填写 → 汇总 → 分享结果 → 匿名讨论」：适合导师评价、学校评价等场景的演示闭环。

## 在线打开

[打开匿名问卷演示](/survey)

> 不在顶栏占位，从本作品详情进入即可。数据仅存本机 \`localStorage\`（\`anon-survey:v1\`）。

## 能体验什么

- **导师评价 / 学校评价** 模板一键创建
- **公开或私密**（口令门禁，错误口令不露题）
- **匿名提交** + 答卷码导入 / 模拟回收 / CSV
- **结果快照**只读分享（可脱敏开放题）
- **匿名讨论区**：随机别名发言、楼中楼回复、讨论打包码合并
- **一键功能验证**套件

## 跨设备说明

无后端时无法实时多人回写。同浏览器用链接；跨设备用问卷定义码 / 答卷码 / 快照码 / 讨论打包码（\`AS4-\`）复制粘贴。
`,
  },
  {
    title: "Graph-RAG Vault · 知识图谱检索",
    description:
      "Obsidian 式双向链接笔记 × Graph-RAG：TF-IDF 种子检索、1-hop 邻居扩展、关系图高亮出处；可对比纯向量模式。挂载 /graph-rag。",
    category: "demo",
    tags: "RAG,知识图谱,Obsidian,检索,TF-IDF,前端演示",
    featured: true,
    published: true,
    sortOrder: 9,
    link: "/graph-rag",
    github: "https://github.com/Az0998/deep-learning/tree/master/code/graph-rag-vault",
    content: `## 一句话

把 Obsidian 的「原子笔记 + 双向链接 + 关系图」与 RAG 检索增强合在一起：提问时先找相似种子，再沿链接扩邻居，并在图上高亮出处。

## 在线打开

[打开 Graph-RAG Vault](/graph-rag)

> 不在顶栏占位，从本作品详情进入即可。检索在浏览器内完成，无需后端。

## 能体验什么

- **Graph-RAG / 纯向量** 一键切换对比
- 力导向**关系图**：种子亮绿、邻居亮蓝
- 引用卡片显示分数与「经由」路径
- 笔记库筛选与 Markdown 预览

## 本地跑（Python）

\`\`\`bash
cd code/graph-rag-vault
pip install -r requirements.txt
python scripts/export_vault.py
python -m src.app
\`\`\`

浏览器访问 \`http://127.0.0.1:5055\`
`,
  },
  {
    title: "易理占筮 · 太极八卦六十四阵",
    description:
      "周易象数学习站：一事一占、天时地利人和、六爻与梅花多算法、体用生克与朱熹动爻玩辞；黑白动态卦阵背景。挂载 /yili。",
    category: "demo",
    tags: "周易,梅花易数,六爻,象数,前端,文化",
    featured: false,
    published: true,
    sortOrder: 11,
    github: "https://github.com/Az0998/yili-divination",
    link: "/yili",
    content: `## 一句话

把《周易》起卦与玩辞做成可体验的学习演示：因事取法，合天时地利人和，依体用与动爻法则观象。

## 在线打开

[打开易理占筮演示](/yili)

源码：[github.com/Az0998/yili-divination](https://github.com/Az0998/yili-divination)

> 不在顶栏占位，从本作品详情进入即可。

## 能体验什么

- **净心立问 → 三才备物 → 择筮成卦 → 观象玩辞** 四步流程
- **六爻三钱**与**时间 / 人物 / 方位 / 报数梅花**五法
- **朱熹《易学启蒙》动爻玩辞法**（贞悔、用九用六）
- **体用五行生克**合月令、时辰、方位
- 黑白动态**太极 · 先天八卦 · 六十四卦阵**背景

## 本地打开

\`\`\`bash
git clone https://github.com/Az0998/yili-divination.git
cd yili-divination
python -m http.server 8080
\`\`\`

浏览器访问 \`http://localhost:8080\`
`,
  },
  {
    title: "HydroInfo 流域水情信息平台",
    description:
      "公开站 CSV 驱动的水情态势看板：多站 KPI、过程线与阈值、质控预警、洪水 CSI 回放、LSTM 指标舱；与作业台同属主导航「智慧水利」。",
    category: "hydro",
    tags: "智慧水利,水信息,Leaflet,CSV,质控,CSI,LSTM",
    featured: true,
    published: true,
    sortOrder: 1,
    github: "https://github.com/Az0998/hydro-info-platform",
    link: "/hydrobench?tab=info",
    content: `## 定位

岗位向最小闭环演示：**采集 → 质控 → 态势 → 预报/洪水评估**。与室内/户外作业台同页签切换，无需二次跳转。

## 在线打开

[打开智慧水利 · 水情态势](/hydrobench?tab=info)

## 能力边界（可核对）

| 模块 | 内容 |
|------|------|
| 站网 | 国内示范站 CSV（可切换）；Leaflet 国内底图 |
| 过程 | 流量 / 水位 / 降水等公制要素出图，叠加注意/警戒阈值 |
| 质控 | 缺失统计、突变粗检、阈值预警 |
| 洪水 | P90 事件切片与 CSI / POD / FAR 回放 |
| 预报 | 业务基线 Persistence→MA7；LSTM 指标对接姊妹论文项目 |

## 本地复现

\`\`\`bash
cd hydro-info-platform
pip install -r requirements.txt
python app.py
\`\`\`

导出个人站静态包：\`python scripts/export_portfolio_bundle.py\`
`,
  },
  {
    title: "HydroBench · 水文双工作台",
    description:
      "智慧水利作业台：室内 DAT/CSV/图片/公式一体处理；户外无网测次、速算与清单；与水情态势同页三页签直达。",
    category: "hydro",
    tags: "水文,工作台,DAT,离线,公式,Canvas,localStorage,智慧水利",
    featured: true,
    published: true,
    sortOrder: 2,
    link: "/hydrobench?tab=studio",
    content: `## 定位

把实习/作业里反复手写的脚本能力收成**室内 / 户外双台**，与水情态势同属「智慧水利」一页三签，点开即用。

| 台 | 职责 | 网络 |
|----|------|------|
| Studio（室内） | 大断面 DAT、水位 CSV、现场照标注、断面/过程线出图、曼宁与面积公式 | 可离线静态打开 |
| Field（户外） | 测次录入、水尺速算、出发/收工清单、JSON/CSV 导出 | **无 CDN**，断网可用 |

## 在线打开

[室内台](/hydrobench?tab=studio) · [户外台](/hydrobench?tab=field)

## 数据与一致性

- 浏览器键前缀 \`hydrobench:\`（测次、清单、公式历史）
- **不写入**站点 Prisma 个人资料 / 作品 CMS
- 与 Novel Studio 的 \`novel-studio-web-demo-v1\` 隔离
- 生产站与 localhost **不同源**；换机用入口「全量备份」

## 样本与约定

- \`section_demo.dat\`：\`点号,备注,X,Y,Z\`（水边备注含「水」；起点距投影对齐实习脚本）
- \`level_demo.csv\`：\`日期,水位\`，支持截断小数相对修正
`,
  },
  {
    title: "临时文件柜 · 到期自毁分享",
    description:
      "个人站临时文件存储：拖拽上传、分享链接、1 小时～7 天 TTL，过期自动删除；主导航 /temp-files。",
    category: "tool",
    tags: "文件分享,临时存储,Render,SQLite,工具",
    featured: false,
    published: true,
    sortOrder: 20,
    link: "/temp-files",
    content: `## 一句话

像随身 U 盘，但会过期：上传 → 拿到分享链接 → 到期自动消失。

## 在线打开

[打开临时文件柜](/temp-files)

## 能力

- 单文件上限 20 MB；有效期 1h / 6h / 1d / 3d / 7d
- 分享页 \`/temp-files/<code>\` + 删除令牌
- 元数据存 SQLite，文件在服务器 \`data/temp-files/\`

## 注意

文件实体写入 **Cloudflare R2**（浏览器预签名直传）；元数据在 SQLite。未配置 \`R2_*\` 时本地开发回退本机磁盘。详见 \`DEPLOY.md\` 第六节。
`,
  },
  {
    title: "波托马克河多时效径流深度学习预报",
    description:
      "多时效径流预报实验闭环：LSTM-Attention 一日 NSE 0.93，含消融、洪水评估与 HSJ 文稿流水线。",
    category: "paper",
    tags: "深度学习,水文,PyTorch,LSTM,XGBoost,HSJ",
    featured: true,
    published: true,
    sortOrder: 3,
    github: "https://github.com/Az0998/hydro-ml-paper",
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

`,
  },
  {
    title: "Novel Studio 写作工作台",
    description:
      "AI 连载工作台：LangGraph 多角色写作环 + FastAPI SaaS 额度壳；网页演示挂载 /novel-studio。",
    category: "demo",
    tags: "LLM,LangGraph,FastAPI,写作工具,SaaS,产品演示",
    featured: false,
    published: true,
    sortOrder: 12,
    github: "https://github.com/Az0998/novel-studio",
    link: "/novel-studio",
    content: `## 一句话

把「种子 → 大纲 → 梗概 → 正文 → 审查 → 排期」做成可体验的工作台：网页验证交互，桌面跑真引擎；一期已加 **Agent 写作环** 与 **SaaS 额度 API**。

## 在线打开

[打开 Novel Studio 演示](/novel-studio)

源码：[github.com/Az0998/novel-studio](https://github.com/Az0998/novel-studio) · Agent 引擎在 [deep-learning/fanqie-novel/automation](https://github.com/Az0998/deep-learning/tree/master/code/fanqie-novel/automation)

> 不在顶栏占位，从本作品详情进入即可。

## 一期能力

- **LangGraph Agent**：策划 → 编剧 → 审稿 ⇄ 改稿（\`--agentic\`）
- **SaaS MVP**：注册登录、免费 1 本、mock 赞助解锁（\`uvicorn saas.app.main:app\`）
- 网页向导 / 流水线 / 赞助发码 UX 验证

## 本地

\`\`\`bash
git clone https://github.com/Az0998/novel-studio.git
cd novel-studio
pip install -r requirements-saas.txt
uvicorn saas.app.main:app --port 8787
\`\`\`

写作 Agent（需 monorepo automation）：

\`\`\`bash
cd code/fanqie-novel/automation
python scripts/write_novel.py --slug <slug> --chapter 1 --agentic
\`\`\`

## 定位

公开展示为**个人写作辅助 / 产品演示**；平台自动化请自行评估合规风险。
`,
  },
  {
    title: "庄方宜 Q 版桌面宠物",
    description:
      "终末地麒麟天师桌宠：透明置顶、多套动画、点击台词与托盘常驻，二次元陪伴向作品。",
    category: "design",
    tags: "PyQt5,桌面宠物,二次元,动画,庄方宜",
    featured: false,
    published: true,
    sortOrder: 30,
    github: "https://github.com/Az0998/zhuangfangyi-desktop-pet",
    content: `## 一句话

让角色住进桌面——无边框透明、始终置顶，写代码时点一下还会跟你打招呼。

源码：[github.com/Az0998/zhuangfangyi-desktop-pet](https://github.com/Az0998/zhuangfangyi-desktop-pet)

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
git clone https://github.com/Az0998/zhuangfangyi-desktop-pet.git
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
    category: "tool",
    tags: "Flask,ECharts,SQLite,可视化,工具",
    featured: false,
    published: true,
    sortOrder: 21,
    github: "https://github.com/Az0998/clipboard-visualizer",
    content: `## 一句话

后台默默记下你复制的文字、图片、路径和链接，再用仪表板把习惯可视化。

源码：[github.com/Az0998/clipboard-visualizer](https://github.com/Az0998/clipboard-visualizer)

## 三分钟体验

\`\`\`bash
git clone https://github.com/Az0998/clipboard-visualizer.git
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
    featured: false,
    published: true,
    sortOrder: 31,
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
    category: "hydro",
    tags: "生态水文,Budyko,NDVI,课程论文",
    featured: false,
    published: true,
    sortOrder: 4,
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
    category: "hydro",
    tags: "水文测验,断面,水位流量,实习",
    featured: false,
    published: true,
    sortOrder: 5,
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
    sortOrder: 6,
    content: `## 一句话

结构化综述写作 + 流域示意图，展示文献梳理与图文编排能力。
`,
  },
];

export const profileContent = {
  name: "张森捷",
  title: "智慧水利 · 水信息 · 机器学习",
  tagline: "把站网态势、质控预警与径流预报做成可点开的产品；作业数据进 HydroBench，态势演示进 HydroInfo。",
  bio: "兰州大学水文与水资源工程方向，目标岗位：智慧水利 / 水信息。日常工作围绕「采集 → 质控 → 态势 → 预报」闭环：用公开站网与自建 CSV 做多站看板，用实习测次与大断面 DAT 做可离线工具台，用深度学习做 1/3/7 日流量实验并统一指标板复现。",
  email: "your.email@example.com",
  location: "兰州 / 中国",
  github: "https://github.com/Az0998",
  website: "https://zhangsjqaq.vexr.dev",
};
