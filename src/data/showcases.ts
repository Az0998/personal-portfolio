export interface Metric {
  label: string;
  value: number;
  display: string;
  note?: string;
}

export interface DemoStep {
  title: string;
  detail: string;
}

export interface Showcase {
  slug: string;
  title: string;
  mood: "hydro" | "pet" | "tool" | "plant" | "field" | "novel" | "paper";
  heroEmoji: string;
  tagline: string;
  highlights: string[];
  metrics?: Metric[];
  demo?: DemoStep[];
  stack: string[];
  galleryHints?: string[];
}

export const showcases: Showcase[] = [
  {
    slug: "smart-water",
    title: "智慧水利管理系统",
    mood: "hydro",
    heroEmoji: "🏞️",
    tagline: "SpringBoot + Vue · 考勤打卡 · 水事任务 · 测报上报 · 仪器借用",
    highlights: [
      "对照农场系统模块，换成洮河测站 / 测报 / 仪器 / 防汛物资",
      "巡测员前台：首页快捷入口、打卡日历、请假、任务反馈、测报与借用",
      "管理员后台：ECharts 看板、审核流、库存预警、操作日志",
      "在线可玩；本地可接 MySQL + SpringBoot 8088",
    ],
    metrics: [
      { label: "角色", value: 2, display: "2" },
      { label: "前台模块", value: 6, display: "6" },
      { label: "后台模块", value: 12, display: "12+" },
    ],
    demo: [
      { title: "巡测员登录", detail: "lintao / 123456 进入首页与考勤页。" },
      { title: "打卡与测报", detail: "上班打卡后登记临洮站水位。" },
      { title: "管理员审核", detail: "admin / admin123 处理请假与仪器借用。" },
    ],
    stack: ["Vue 3", "Element Plus", "ECharts", "SpringBoot", "MyBatis-Plus", "MySQL"],
    galleryHints: ["首页测站卡", "考勤日历", "后台看板", "仪器借用"],
  },
  {
    slug: "yili",
    title: "易理占筮 · 太极八卦六十四阵",
    mood: "tool",
    heroEmoji: "☯",
    tagline: "一事一占 · 三才备物 · 多法起卦 · 朱熹动爻玩辞",
    highlights: [
      "挂载于个人站 /yili，黑白动态太极八卦六十四阵背景",
      "独立仓库 github.com/Az0998/yili-divination",
      "因事推荐六爻 / 时间·人物·方位·报数梅花",
      "体用五行合月令时辰方位；朱熹动爻玩辞法",
    ],
    metrics: [
      { label: "起卦算法", value: 5, display: "5" },
      { label: "事类", value: 8, display: "8" },
      { label: "六十四卦", value: 64, display: "64" },
    ],
    demo: [
      { title: "打开 /yili", detail: "作品卡片点「打开演示」进入易理占筮。" },
      { title: "净心立问", detail: "勾选诚意、写清一事、选择事件类型。" },
      { title: "三才择法", detail: "填天时地利人和，确认推荐筮法后开筮。" },
      { title: "观象玩辞", detail: "看本卦之卦、动爻主断辞与体用生克。" },
    ],
    stack: ["HTML/CSS/JS", "Canvas 卦阵", "象数算法", "Next.js 挂载"],
    galleryHints: ["太极卦阵背景", "四步流程", "铜钱动效", "体用仪表"],
  },
  {
    slug: "hydro-info",
    title: "HydroInfo 流域水情信息平台",
    mood: "hydro",
    heroEmoji: "💧",
    tagline: "国内示范站网 · Leaflet · CSI 回放 · LSTM 指标 · 可变出图",
    highlights: [
      "主导航「智慧水利」一页直达水情态势",
      "洮河坐标示范站网 + Leaflet 交互地图",
      "洪水 P90 事件回放与 1/3/7 日 CSI / POD / FAR",
      "可变要素：流量、水位、降水、气温、上游与多模型曲线",
    ],
    metrics: [
      { label: "LSTM-Attn · 1日 NSE", value: 0.93, display: "0.930" },
      { label: "洪水 CSI · 1日 Attn", value: 0.75, display: "0.750" },
      { label: "示范站点", value: 3, display: "3" },
    ],
    demo: [
      { title: "打开智慧水利", detail: "顶栏或作品「打开演示」进入，默认水情态势页签。" },
      { title: "地图点站", detail: "Leaflet 上查看临洮 / 渭源 / 康乐瞬时流量与状态。" },
      { title: "勾选出图", detail: "切换 Q/Z/P/T/上游/模型曲线，缩放查看过程。" },
      { title: "洪水回放", detail: "自动或手动切换 P90 事件窗，对照 CSI 表。" },
    ],
    stack: ["Next.js", "ECharts", "Leaflet", "Python 导出", "LSTM 指标对接"],
    galleryHints: ["站网地图", "可变过程线", "CSI 柱状图", "洪水事件列表"],
  },
  {
    slug: "hydrobench",
    title: "HydroBench · 水文双工作台",
    mood: "field",
    heroEmoji: "🛠️",
    tagline: "与水情态势同页 · 室内集成 · 户外应急离线 · 本机缓存可导出",
    highlights: [
      "同一「智慧水利」页内切换：态势 / 室内 / 户外",
      "Studio：DAT/CSV/水位、图片标注、公式与出图",
      "Field：无网录入、速算、清单、回城导出",
      "本机缓存可导出迁移，与个人资料后台隔离",
    ],
    metrics: [
      { label: "工作台", value: 2, display: "2" },
      { label: "公式模板", value: 5, display: "5" },
      { label: "CDN 依赖", value: 0, display: "0" },
    ],
    demo: [
      { title: "打开智慧水利", detail: "顶栏进入后点「室内台」或「户外台」页签即可。" },
      { title: "载入样本 DAT", detail: "室内台解析断面并生成剖面图。" },
      { title: "户外录入", detail: "断网也可追加测次，勾选清单。" },
      { title: "备份迁移", detail: "工作台内导出全量备份，换机导入。" },
    ],
    stack: ["HTML/CSS/JS", "Canvas", "localStorage", "Next.js 静态挂载"],
    galleryHints: ["双台入口", "断面预览", "户外清单", "备份条"],
  },
  {
    slug: "hydro-ml",
    title: "波托马克河多时效径流深度学习预报",
    mood: "hydro",
    heroEmoji: "🌊",
    tagline: "上游站点 + 气象驱动，LSTM-Attention 一日预报 NSE 达 0.93",
    highlights: [
      "面向 Hydrological Sciences Journal 的完整实验与文稿流水线",
      "对比 Persistence / ARIMA / XGBoost / LSTM / LSTM-Attention",
      "含上游信息消融、洪水 CSI、QPF 阶梯与转移学习试验",
      "可复现的数据下载、训练、消融与论文插图脚本",
    ],
    metrics: [
      { label: "LSTM-Attn · 1日 NSE", value: 0.93, display: "0.930", note: "最优一日预报" },
      { label: "XGBoost · 1日 NSE", value: 0.92, display: "0.916" },
      { label: "LSTM · 3日 NSE", value: 0.54, display: "0.543", note: "中期最优" },
      { label: "Persistence · 1日 NSE", value: 0.79, display: "0.787", note: "基线" },
    ],
    demo: [
      { title: "数据接入", detail: "USGS 日流量 + Open-Meteo 气象，整理为多站长表与流域元数据。" },
      { title: "模型训练", detail: "统一评估框架输出 NSE / KGE / RMSE / MAE / PBIAS，并生成结果 JSON。" },
      { title: "消融与洪水", detail: "关闭上游信息、评估洪峰命中 CSI，检验空间信息与极端事件表现。" },
      { title: "文稿产出", detail: "自动生成图表、表格与 HSJ 风格稿件，形成可投稿闭环。" },
    ],
    stack: ["Python", "PyTorch", "XGBoost", "pandas", "matplotlib", "USGS API"],
    galleryHints: ["流域示意图", "预报过程线", "模型对比柱状图", "消融实验结果"],
  },
  {
    slug: "desktop-pet",
    title: "庄方宜 Q 版桌面宠物",
    mood: "pet",
    heroEmoji: "🦉",
    tagline: "「护生安民，职责所在」—— 天师麒麟常驻桌面陪你学习",
    highlights: [
      "无边框透明置顶窗口，像真正的桌宠一样漂在桌面上",
      "站立 / 行走 / 挥手 / 开心 / 打瞌睡多套序列帧动画",
      "点击互动语音气泡、拖拽移动、右键菜单与系统托盘",
      "config.json 可调尺寸、位置、语速与空闲行为",
    ],
    demo: [
      { title: "启动宠物", detail: "python main.py 后出现透明悬浮窗口，始终置顶。" },
      { title: "点击互动", detail: "单击触发挥手动画与随机台词气泡。" },
      { title: "拖拽安放", detail: "按住拖到桌面任意角落，配置文件记住偏好。" },
      { title: "空闲打瞌睡", detail: "长时间无操作自动切换 sleepy 序列帧。" },
    ],
    stack: ["Python", "PyQt5", "序列帧动画", "系统托盘"],
    galleryHints: ["悬浮截图", "挥手动画帧", "气泡台词", "托盘菜单"],
  },
  {
    slug: "clipboard-viz",
    title: "剪贴板智能可视化仪表板",
    mood: "tool",
    heroEmoji: "📋",
    tagline: "监听 · 分类 · 入库 · ECharts 一眼看清复制习惯",
    highlights: [
      "0.5s 轮询监听，自动识别文本 / 图片 / 路径 / URL",
      "图片自动落盘 PNG，历史全量进 SQLite",
      "统计卡片 + 趋势图 + 饼图 + 可搜索分页表格",
      "支持详情弹窗、复制回写与 CSV 导出",
    ],
    demo: [
      { title: "启动服务", detail: "python app.py 同时启动监听器与 Flask 仪表板。" },
      { title: "复制任意内容", detail: "复制文字、截图或路径，后台自动分类入库。" },
      { title: "打开看板", detail: "访问 http://127.0.0.1:5000 查看今日增量与类别分布。" },
      { title: "检索导出", detail: "按关键词筛选历史，一键导出 CSV。" },
    ],
    stack: ["Flask", "SQLAlchemy", "ECharts", "Pillow", "SQLite"],
    galleryHints: ["仪表板总览", "类别饼图", "时间趋势", "图片预览弹窗"],
  },
  {
    slug: "plant-ppt",
    title: "植物叶片形态分析演示文稿",
    mood: "plant",
    heroEmoji: "🌿",
    tagline: "深林绿 × 奶油学术风，跨场景解读叶片形态与生态逻辑",
    highlights: [
      "python-pptx 程序化生成完整学术演示稿",
      "覆盖森林、土楼、玉米、松针、银杏、凤梨科等场景",
      "形态特征表 + 生态功能解释，适合课程汇报",
      "统一自然学术配色，观感精致克制",
    ],
    demo: [
      { title: "准备素材", detail: "整理场景照片与形态描述表格。" },
      { title: "一键生成", detail: "运行 create_plant_ppt.py 输出 PPTX。" },
      { title: "课堂演示", detail: "按场景翻页讲解叶片适应策略。" },
    ],
    stack: ["Python", "python-pptx", "Pillow"],
    galleryHints: ["封面页", "场景分析页", "分类总结页"],
  },
  {
    slug: "eco-hydro",
    title: "波托马克流域生态水文耦合分析",
    mood: "hydro",
    heroEmoji: "🌍",
    tagline: "Budyko 水均衡 × 植被—水文耦合，课程论文级分析流水线",
    highlights: [
      "整合 USGS 径流、Open-Meteo 降水/潜在蒸散、NDVI",
      "Budyko 框架刻画干湿状态与水分利用效率",
      "输出统计表、分析图与答辩演示文稿",
    ],
    stack: ["Python", "pandas", "scipy", "matplotlib"],
    galleryHints: ["Budyko 曲线", "NDVI—径流关系", "答辩 PPT"],
  },
  {
    slug: "hydrology-field",
    title: "水文测验与资料整编实践合集",
    mood: "field",
    heroEmoji: "📏",
    tagline: "水位过程 · 大断面 · 绳套曲线 · 评级延长，把野外数据做成图",
    highlights: [
      "日水位处理与频率/历时曲线",
      "全站仪大断面 → CSV / Excel / DXF / SWS",
      "绳套法洪水流量与水位流量关系延长",
      "兰州大学综合实习报告配套图表",
    ],
    demo: [
      { title: "野外采集", detail: "水位观测、断面测点、测流数据入库。" },
      { title: "脚本整编", detail: "批量清洗 Excel，生成过程线与断面图。" },
      { title: "CAD/报表", detail: "导出 DXF 与计算表，写入实习报告。" },
    ],
    stack: ["Python", "Excel", "DXF", "matplotlib"],
    galleryHints: ["水位过程线", "大断面图", "Z–Q 绳套曲线"],
  },
  {
    slug: "yaohe-review",
    title: "洮河与黄河水文地理综述",
    mood: "paper",
    heroEmoji: "📜",
    tagline: "自然地理 · 水文气象 · 水资源与经济社会，兰大格式综述稿",
    highlights: [
      "中英标题与兰大学位论文式排版",
      "流域示意地图自动绘制",
      "串联自然背景与人水关系叙事",
    ],
    stack: ["python-docx", "matplotlib"],
    galleryHints: ["流域示意图", "文稿封面"],
  },
  {
    slug: "novel-studio",
    title: "Novel Studio 写作工作台",
    mood: "novel",
    heroEmoji: "✍️",
    tagline: "网页演示挂载 /novel-studio · 向导 / 流水线 / 赞助发码 / 一键验证",
    highlights: [
      "挂载于个人站 /novel-studio，不占用顶栏主导航",
      "独立仓库 github.com/Az0998/novel-studio",
      "新建书向导、工作台流水线、赞助下单发码闭环可交互验证",
      "免费 1 本额度与赞助解锁逻辑可在浏览器本地演练",
    ],
    demo: [
      { title: "打开演示", detail: "作品卡片点「打开演示」进入 /novel-studio。" },
      { title: "向导建书", detail: "填写书名 slug，登记第一本免费书目。" },
      { title: "跑流水线", detail: "梗概 → 写作 → 审查步骤点亮进度。" },
      { title: "功能验证", detail: "一键验证套件检查额度、赞助与设置持久化。" },
    ],
    stack: ["Next.js", "localStorage 演示", "Python 桌面端", "LLM"],
    galleryHints: ["向导面板", "工作台", "赞助发码", "验证表"],
  },
  {
    slug: "survey",
    title: "匿名问卷 · 分发填写与汇总",
    mood: "tool",
    heroEmoji: "📋",
    tagline: "公开/私密问卷 · 匿名填写汇总 · 结果快照 · 匿名讨论区",
    highlights: [
      "挂载于个人站 /survey，不占用顶栏主导航",
      "导师评价 / 学校评价模板；公开或私密口令分发",
      "结果只读快照分享 + 问卷绑定的匿名讨论板（随机别名）",
      "讨论打包码跨设备合并；一键功能验证覆盖主路径",
    ],
    metrics: [
      { label: "题型", value: 4, display: "4" },
      { label: "预置模板", value: 2, display: "2" },
      { label: "验证用例", value: 8, display: "8" },
    ],
    demo: [
      { title: "打开 /survey", detail: "作品卡片点「打开演示」进入匿名问卷。" },
      { title: "选模板发布", detail: "导师或学校模板，设公开/私密后发布。" },
      { title: "汇总分享", detail: "看分布均值，生成只读快照。" },
      { title: "匿名讨论", detail: "随机别名发言，导出讨论打包码。" },
    ],
    stack: ["Next.js", "React", "localStorage", "Base64 分享码"],
    galleryHints: ["雾蓝表单背景", "填写进度", "讨论流", "验证表"],
  },
];

export function getShowcaseByTitle(title: string): Showcase | undefined {
  return showcases.find((s) => s.title === title);
}
