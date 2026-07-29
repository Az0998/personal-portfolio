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
    title: "HydroInfo 流域水情信息平台",
    description:
      "黄河—洮河公开站 CSV：10 站可切换，流量/水位/降水/气温/含沙量/过水面积可变出图，Leaflet 国内底图，挂载 /hydro。",
    category: "project",
    tags: "智慧水利,水信息,Leaflet,CSV,黄河,洮河,LSTM",
    featured: true,
    published: true,
    sortOrder: 0,
    github: "https://github.com/Az0998/hydro-info-platform",
    link: "/hydro",
    content: `## 一句话

面向智慧水利岗位的信息闭环：**采集 → 质控 → 态势 → 预报/洪水评估**，演示已挂在本站 \`/hydro\`。

## 在线打开

[打开 HydroInfo 演示](/hydro)

## 能力

- **国内公开站 CSV**：10 站（兰州/临洮/渭源/康乐/青铜峡/石嘴山/头道拐/潼关/花园口/利津）
- **站点切换**：下拉 + 站条 + 地图点击
- **公制参数**：流量 m³/s、水位 m、降水、气温、含沙量、过水面积
- **Leaflet**：高德/GeoQ 国内底图（修复 OSM 空白）
- **洪水 CSI 回放** + **LSTM 指标舱**

## 本地 Flask（同源）

\`\`\`bash
cd hydro-info-platform
pip install -r requirements.txt
python app.py
\`\`\`

导出个人站数据包：\`python scripts/export_portfolio_bundle.py\`
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
    sortOrder: 1,
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

## 进展同步

本站作品文案以仓库 \`src/data/works-content.ts\` 为准；你推 GitHub → Render 自动部署 → 构建时同步更新介绍。
`,
  },
  {
    title: "Novel Studio 写作工作台",
    description:
      "AI 连载工作台网页演示：向导建书、流水线、赞助发码与功能验证；桌面端负责本机 LLM 与发布。挂载 /novel-studio。",
    category: "project",
    tags: "LLM,写作工具,Next.js,桌面应用,产品演示",
    featured: true,
    published: true,
    sortOrder: 2,
    link: "/novel-studio",
    content: `## 一句话

把「种子 → 大纲 → 梗概 → 正文 → 审查 → 排期」做成可体验的工作台：网页验证交互，桌面跑真引擎。

## 在线打开

[打开 Novel Studio 演示](/novel-studio)

> 不在顶栏占位，从本作品详情进入即可。

## 网页能验证什么

- **新建书向导**与免费 1 本额度
- **工作台流水线**步骤状态
- **赞助 ¥8 / 7 天**：下单 → 发码 → 激活闭环
- **一键功能验证**套件
- API Key / 模型配置预演（仅存浏览器本地）

## 桌面端（完整能力）

\`\`\`bash
cd fanqie-novel/novel-studio
pip install -r requirements.txt
python -m app.main
\`\`\`

便携包：\`python tools/build_portable.py\`

## 定位

公开展示为**个人写作辅助 / 产品演示**；平台自动化请自行评估合规风险。
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
    sortOrder: 3,
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
    sortOrder: 4,
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
    sortOrder: 5,
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
];

export const profileContent = {
  name: "张森捷",
  title: "智慧水利 · 水信息 · 机器学习",
  tagline: "用信息链路读懂河流，用模型把预报落到可展示的产品形态",
  bio: "兰州大学水文与水资源工程方向，目标从事智慧水利与水信息。白天做站网态势、质控预警和径流预报；也用深度学习把上游信息价值写进论文流水线。业余养桌宠、做小工具。\n\n作品介绍以仓库数据源自动同步：改本地/GitHub 文案并推送后，站点部署时更新。",
  email: "your.email@example.com",
  location: "兰州 / 中国",
  github: "https://github.com/Az0998",
  website: "https://zhangsjqaq.vexr.dev",
};
