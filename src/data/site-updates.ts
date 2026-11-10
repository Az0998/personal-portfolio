export type SiteUpdate = {
  id: string;
  date: string;
  title: string;
  lead: string;
  points: string[];
};

/** Newest first. Banner dismiss key is `site-update:${CURRENT_UPDATE.id}`. */
export const SITE_UPDATES: SiteUpdate[] = [
  {
    id: "2026-11-10-ops-audit",
    date: "2026-11-10",
    title: "双端在线：Render 主站 + 阿里云课用机",
    lead: "主站 HTTPS 走 Render；蒸渗仪可操作课堂另有阿里云公网入口。课上优先七步实验站。",
    points: [
      "主站：https://zhangsjqaq.vexr.dev （含 /sfl-lab 嵌 Render 七步课堂 https://sfl-lab.onrender.com ）",
      "阿里云课用机：http://47.109.64.111 （个人站）与 http://47.109.64.111:8080/ （可操作七步，systemd 常驻）",
      "旧版 /sfl 已重定向到 /sfl-lab；智慧水利总览第一张卡就是微型蒸渗仪。",
      "课上第一步用「载入课堂示例」；上传实测为选做。面试导览仍是：作业台 → 一张图 → 态势 → 产汇流 → 论证文档。",
    ],
  },
  {
    id: "2026-11-10-sfl-classroom",
    date: "2026-11-10",
    title: "采集课堂接到七步实验站",
    lead: "课上请走七步实验站 /sfl-lab。旧版 /sfl 已转到这里。",
    points: [
      "课上主入口：智慧水利总览第一张卡就是微型蒸渗仪，标成已上线。",
      "课上第一步改为「载入课堂示例」。上传实测、自由作图都是选做。",
      "面试五分钟导览仍是：室内作业 → 一张图 → 态势 → 产汇流 → 论证文档。",
    ],
  },
];

export const CURRENT_UPDATE = SITE_UPDATES[0];
