import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const works = [
  {
    title: "波托马克河多时效径流深度学习预报",
    description:
      "融合上游站点与气象驱动的多时效径流预报：LSTM-Attention 一日 NSE 达 0.93，含完整实验、消融与投稿文稿流水线。",
    category: "paper",
    tags: "深度学习,水文,PyTorch,LSTM,XGBoost,HSJ",
    featured: true,
    published: true,
    sortOrder: 1,
    content: `## 项目背景

波托马克河流域流量预报对防洪与水资源调度至关重要。本项目构建**多时效（1/3/7 日）**预报体系，系统对比统计基线与深度学习模型，并面向 *Hydrological Sciences Journal* 整理可复现实验与文稿。

## 方法亮点

- **多源输入**：USGS 日流量 + Open-Meteo 气象 + 上游站点空间信息
- **模型矩阵**：Persistence / ARIMA / XGBoost / LSTM / LSTM-Attention
- **深度评估**：NSE、KGE、RMSE、MAE、PBIAS；洪水事件 CSI
- **消融试验**：关闭上游信息，量化空间信号贡献
- **工程闭环**：\`run_experiment.py\` → 指标 JSON → 插图/表格 → 稿件生成

## 关键结果（测试集）

| 模型 | 1日 NSE | 3日 NSE |
|------|---------|---------|
| Persistence | 0.787 | 0.164 |
| XGBoost | **0.916** | 0.472 |
| LSTM | 0.912 | **0.543** |
| LSTM-Attention | **0.930** | 0.459 |

一日尺度上 **LSTM-Attention** 最优；三日尺度 **LSTM** 更具优势，说明注意力在短临预报中更吃香，中期则更依赖时序记忆。

## 本地演示

\`\`\`bash
cd hydro-ml-paper
pip install -r requirements.txt
python download_data.py
python run_experiment.py
python run_ablation.py
\`\`\`

## 可视化建议

打开详情页上方的「关键指标可视化」与「演示流程」，即可快速理解模型对比与复现路径。完整图件可在 \`results/\` 与文稿脚本中再生。
`,
  },
  {
    title: "庄方宜 Q 版桌面宠物",
    description:
      "明日方舟：终末地·麒麟天师 Q 版桌宠。透明置顶、多套动画、点击台词与托盘常驻，给你的桌面一点二次元陪伴。",
    category: "code",
    tags: "PyQt5,桌面宠物,二次元,动画,庄方宜",
    featured: true,
    published: true,
    sortOrder: 2,
    content: `## 角色设定

> 「护生安民，职责所在」

把喜欢的角色做成**真正能住在桌面上的伙伴**：无边框透明窗口、始终置顶，像贴纸一样陪你写代码、刷文献。

## 功能地图

| 能力 | 说明 |
|------|------|
| 悬浮显示 | 透明背景 + 置顶 |
| 动画系统 | idle / walk / wave / happy / sleepy |
| 点击互动 | 挥手 + 随机台词气泡 |
| 拖拽安放 | 任意角落，配置可记忆 |
| 空闲行为 | 久置自动打瞌睡 |
| 系统托盘 | 最小化后双击唤出 |

## 本地演示

\`\`\`bash
cd zhuangfangyi-desktop-pet
pip install -r requirements.txt
python generate_placeholders.py   # 首次可生成占位帧
python main.py
\`\`\`

## 个性化

编辑 \`config.json\` 可调窗口尺寸、初始坐标、帧率和台词列表——欢迎换成你自己的角色素材。
`,
  },
  {
    title: "剪贴板智能可视化仪表板",
    description:
      "后台监听剪贴板，自动分类文本/图片/路径/URL，SQLite 入库，Flask + ECharts 实时看板。",
    category: "project",
    tags: "Flask,ECharts,SQLite,可视化,工具",
    featured: true,
    published: true,
    sortOrder: 3,
    content: `## 解决什么问题

复制记录转瞬即逝。这个工具把每一次复制变成**可检索、可统计、可导出**的数据资产。

## 能力清单

1. **0.5s 监听** — 几乎实时捕获
2. **智能分类** — 文本 / 图片 / 路径 / URL / 富文本
3. **图片落盘** — PNG 存入 \`saved_images/\`
4. **看板** — 统计卡片、趋势、饼图、分页表格
5. **导出** — CSV 一键带走

## 本地演示

\`\`\`bash
cd clipboard-visualizer
pip install -r requirements.txt
python app.py
\`\`\`

浏览器打开 **http://127.0.0.1:5000**，随意复制几段内容，看仪表板跳动。

## 推荐体验路径

复制一段代码 → 再截一张图 → 再复制一个 URL，然后在看板里按类型筛选，感受分类准确度。
`,
  },
  {
    title: "植物叶片形态分析演示文稿",
    description:
      "程序化生成的学术风 PPT：跨森林、农田与城市场景，解读叶片形态与生态适应。",
    category: "design",
    tags: "python-pptx,植物,生态,课程汇报",
    featured: true,
    published: true,
    sortOrder: 4,
    content: `## 设计语言

深林绿 × 奶油学术底，拒绝花哨模板。每一页场景都配形态表与生态解释，适合课堂与展览讲解。

## 内容结构

- 封面与研究问题
- 多场景叶片观察（森林、土楼、玉米、松针、银杏、凤梨科等）
- 形态特征对照表
- 分类与适应策略总结

## 本地演示

\`\`\`bash
python create_plant_ppt.py
\`\`\`

生成 \`植物叶片分析.pptx\` 后直接放映。详情页「可视化素材」区可对照你之后上传的封面截图。
`,
  },
  {
    title: "波托马克流域生态水文耦合分析",
    description:
      "Budyko 水均衡框架下的植被—水文耦合课程分析：径流、降水、PET 与 NDVI 一体化流水线。",
    category: "project",
    tags: "生态水文,Budyko,NDVI,课程论文",
    featured: false,
    published: true,
    sortOrder: 5,
    content: `## 研究问题

在波托马克华盛顿上游，气候干湿状态如何约束径流与植被活力？本项目用 Budyko 框架把气象、水文与 NDVI 放在同一叙事里。

## 工作流

1. 拉取 USGS 径流与 Open-Meteo 气象
2. 计算潜在蒸散与干旱指数
3. 关联 NDVI，绘制耦合关系
4. 输出统计表、图件与答辩 PPT

适合作为**学术作品集**里「方法 + 图表」展示单元。
`,
  },
  {
    title: "水文测验与资料整编实践合集",
    description:
      "水位过程线、全站仪大断面、绳套洪水流量、水位流量关系延长——把野外数据整成图表与 DXF。",
    category: "project",
    tags: "水文测验,断面,水位流量,实习",
    featured: false,
    published: true,
    sortOrder: 6,
    content: `## 合集说明

将多个实习/作业模块打包成一条「从野外到报表」的故事线：

- **水位整编**：日水位 → 过程线 / 频率 / 历时
- **大断面**：全站仪 \`.dat\` → CSV / Excel / DXF / SWS
- **测流**：绳套法洪水 Z–Q 与改正系数
- **评级延长**：历史站年水位流量关系延展
- **综合实习报告**：榆中/红旗站等图文素材

## 演示看点

优先展示三张图：水位过程线、大断面形态、绳套曲线。它们最能一眼说明「我会把野外数据做成可用成果」。
`,
  },
  {
    title: "洮河与黄河水文地理综述",
    description:
      "洮河—黄河自然地理、水文气象与水资源经济社会综述，配套流域示意地图。",
    category: "paper",
    tags: "综述,洮河,黄河,兰州大学",
    featured: false,
    published: true,
    sortOrder: 7,
    content: `## 文稿定位

兰州大学格式的中文综述稿，串联自然本底与人水关系，适合放在作品集「论文/写作」分区。

## 产出

- 结构化 Word 文稿
- matplotlib 流域示意
- 中英标题与章节骨架
`,
  },
  {
    title: "Novel Studio 写作工作台",
    description:
      "个人向连载写作助手：大纲到章节的流水线、质量门禁与桌面端便携打包。",
    category: "project",
    tags: "LLM,写作工具,桌面应用",
    featured: false,
    published: true,
    sortOrder: 8,
    content: `## 产品定位

面向个人创作者的**本地写作工作台**：管理多书目、生成大纲与章节草稿，并通过质量评分门禁控制产出下限。

## 演示重点

1. 新建书目与文风配置  
2. 从故事种子到卷纲 / 章纲  
3. 章节质检分数与返工循环  

公开展示强调「个人写作辅助」，不涉及任何绕过平台规则的用途。
`,
  },
];

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  await prisma.profile.upsert({
    where: { id: "default-profile" },
    update: {
      name: "张森捷",
      title: "水文 · 机器学习 · 二次元创作者",
      tagline: "用模型读懂河流，用代码留下一点动漫浪漫",
      bio: "兰州大学水文与水资源工程方向。白天和流量、Budyko、LSTM 较劲；晚上给桌面养一只麒麟天师，顺便把剪贴板和写作流水线也做成工具。\n\n这里同步了我工作区里真正值得展示的项目：水文深度学习预报、桌宠、可视化看板、植物形态 PPT、生态水文分析、野外测验整编，以及个人写作工作台。每个作品页都配有介绍、演示流程和指标可视化。",
      email: "your.email@example.com",
      location: "兰州 / 中国",
      github: "https://github.com",
      website: "https://zhangsjqaq.vexr.dev",
    },
    create: {
      id: "default-profile",
      name: "张森捷",
      title: "水文 · 机器学习 · 二次元创作者",
      tagline: "用模型读懂河流，用代码留下一点动漫浪漫",
      bio: "兰州大学水文与水资源工程方向。白天和流量、Budyko、LSTM 较劲；晚上给桌面养一只麒麟天师，顺便把剪贴板和写作流水线也做成工具。\n\n这里同步了我工作区里真正值得展示的项目：水文深度学习预报、桌宠、可视化看板、植物形态 PPT、生态水文分析、野外测验整编，以及个人写作工作台。每个作品页都配有介绍、演示流程和指标可视化。",
      email: "your.email@example.com",
      location: "兰州 / 中国",
      github: "https://github.com",
      website: "https://zhangsjqaq.vexr.dev",
    },
  });

  // Production-safe: do not wipe existing works unless FORCE_SEED=1
  if (process.env.FORCE_SEED === "1") {
    await prisma.work.deleteMany();
  }

  for (const work of works) {
    const existing = await prisma.work.findFirst({ where: { title: work.title } });
    if (existing) {
      if (process.env.FORCE_SEED === "1") {
        await prisma.work.update({ where: { id: existing.id }, data: work });
      }
    } else {
      await prisma.work.create({ data: work });
    }
  }

  console.log(`Seeded ${works.length} works + profile for 张森捷`);
  console.log(`Admin login: ${username} / ${password}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
