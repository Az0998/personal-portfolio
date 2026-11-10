/** Engineer review attached to work detail pages. Keyed by CMS title. */
export type ProjectReview = {
  stage: "可演示" | "可上课" | "汇报稿" | "本机工具";
  stack: string;
  limit: string;
  next: string;
};

export const PROJECT_REVIEWS: Record<string, ProjectReview> = {
  "微型蒸渗仪实验站": {
    stage: "可上课",
    stack: "Spring Boot + Vue；个人站 iframe；阿里云 :8080 systemd",
    limit: "2G 机内存紧；主站 HTTPS 与课用机 HTTP 双入口，冷启动体验不一致。",
    next: "阿里云上 HTTPS；课堂三道判断已进报告页，课上先载入示例再提交。",
  },
  "新安江机理预报对照台": {
    stage: "可演示",
    stack: "浏览器 TypeScript 三水源；合成 forcing；NSE/RMSE/KGE",
    limit: "观测由真值+噪声合成，全段高分需配合留出段解读；非实测站网。",
    next: "换一段真实日资料（去标识）做第二场景；导出图直接进简历 PDF。",
  },
  "流域「一张图」GIS 小站": {
    stage: "可演示",
    stack: "Leaflet + GeoJSON；示意流域",
    limit: "底图与数据是示意，不是生产一张图。",
    next: "接 HydroInfo 同一测站 ID；点击测站打开态势过程线抽屉（部分已有，保持 ID 对齐）。",
  },
  "HydroInfo 流域水情信息平台": {
    stage: "可演示",
    stack: "静态 JSON + 看板；挂在 /hydrobench?tab=info",
    limit: "数据为打包快照，不是实时库。",
    next: "标明数据截止日期；异常站与一张图、机理台用同一流域故事讲完。",
  },
  "HydroBench · 水文双工作台": {
    stage: "可演示",
    stack: "静态 HTML 室内/户外台；localStorage",
    limit: "作业数据只在浏览器，换设备即丢。",
    next: "导出测次包（JSON）以便和蒸渗仪、水平衡草稿互相粘贴。",
  },
  "水资源论证 / 水平衡报告生成器": {
    stage: "可演示",
    stack: "浏览器计算 + 报告草稿",
    limit: "模板是教学草稿，不是审查用正式报告。",
    next: "增加水量闭合检查条（类似新安江平衡卡）；导出 Markdown/PDF。",
  },
  "智慧水利管理系统": {
    stage: "可演示",
    stack: "前端静态包（原 Spring+Vue 业务演示）",
    limit: "站内是演示前端；默认账号只应出现在说明里，不要当生产口令。",
    next: "若要真后端，单独部署 smart-water-mgmt 并关公网默认口令。",
  },
  "波托马克河多时效径流深度学习预报": {
    stage: "汇报稿",
    stack: "论文/PPT；对照入口在 /presentations/hydro-ml 与 /xaj-bench",
    limit: "训练栈不在本站在线跑。",
    next: "汇报页固定链到机理台同口径 NSE，避免两套数字。",
  },
  "中国象棋 · AlphaZero 策略网": {
    stage: "可演示",
    stack: "浏览器 ONNX；训练在本地 Python",
    limit: "在线是策略网对弈，不是完整 MCTS 自对弈集群。",
    next: "页眉已标明推理在浏览器、训练在本地；下一步可回放最近一手。",
  },
  "Graph-RAG Vault · 知识图谱检索": {
    stage: "可演示",
    stack: "浏览器 TF-IDF + 邻居扩展",
    limit: "语料是内置小库，不是用户 Obsidian 全库。",
    next: "允许粘贴若干 Markdown 笔记做当场索引（仍不上传服务器）。",
  },
  "匿名问卷 · 分发填写与汇总": {
    stage: "可演示",
    stack: "浏览器本地存储",
    limit: "换浏览器数据不在；不适合正式学评。",
    next: "导出汇总 CSV；醒目标注「演示，非教务系统」。",
  },
  "临时文件柜 · 到期自毁分享": {
    stage: "可演示",
    stack: "Next API + SQLite；可选 R2",
    limit: "Render 磁盘易失；未配 R2 时文件随实例丢失。",
    next: "首页已提示未配 R2 会随磁盘丢失；生产环境打开 R2 直传。",
  },
  "Novel Studio 写作工作台": {
    stage: "可演示",
    stack: "网页向导；本机 LLM 不在站上",
    limit: "在线不能真生成长篇。",
    next: "示例书跑通流水线空壳，明确「桌面端才接模型」。",
  },
  "易理占筮 · 太极八卦六十四阵": {
    stage: "可演示",
    stack: "静态前端",
    limit: "文化演示，不是预测产品。",
    next: "保持免责；可加「一事一占」步骤提示，避免连占。",
  },
  "跨云复制": {
    stage: "本机工具",
    stack: "Windows 本地程序 + 下载页",
    limit: "网站不代登录网盘。",
    next: "校验下载包哈希写在页面上。",
  },
  "东海陆架溶解氧中长期预报": {
    stage: "可演示",
    stack: "GitHub Pages 外链",
    limit: "不在本仓库运行时里。",
    next: "作品卡保留外链，并写模型时效与验证指标来源。",
  },
  "CS 人生模拟 · AI 转盘事件": {
    stage: "可演示",
    stack: "站内互动",
    limit: "娱乐向，不进入水利主叙事。",
    next: "维持独立皮肤，避免和 Hydro 视觉混用。",
  },
  "人生模拟枢纽 · 多领域转盘": {
    stage: "可演示",
    stack: "多主题转盘",
    limit: "内容向演示。",
    next: "每个主题一句话边界，链回对应专业作品（水文主题 → hydrobench）。",
  },
  "庄方宜 Q 版桌面宠物": {
    stage: "汇报稿",
    stack: "演示文稿",
    limit: "无在线宠物运行时。",
    next: "若有可执行包再挂下载；否则保持 PPT。",
  },
  "剪贴板智能可视化仪表板": {
    stage: "汇报稿",
    stack: "演示文稿",
    limit: "依赖本机剪贴板，网页不宜直接读用户剪贴板。",
    next: "保持介绍页；不要做无授权的剪贴板抓取。",
  },
  "植物叶片形态分析演示文稿": {
    stage: "汇报稿",
    stack: "演示文稿",
    limit: "无在线分割推理。",
    next: "若有样例图，汇报里放前后对比即可。",
  },
  "波托马克流域生态水文耦合分析": {
    stage: "汇报稿",
    stack: "演示文稿",
    limit: "研究叙述，不是在线模型。",
    next: "与 Hydro-ML、一张图用同一流域地名，避免三套故事。",
  },
  "水文测验与资料整编实践合集": {
    stage: "汇报稿",
    stack: "演示文稿 + HydroBench 作业台",
    limit: "整编工具在室内台，合集本身是文档。",
    next: "每章链到 /hydrobench?tab=studio 对应操作。",
  },
  "洮河与黄河水文地理综述": {
    stage: "汇报稿",
    stack: "演示文稿",
    limit: "综述，无计算服务。",
    next: "保留文献边界，不扩成未验证的预报产品。",
  },
};

export function reviewForTitle(title: string): ProjectReview | null {
  return PROJECT_REVIEWS[title] ?? null;
}
