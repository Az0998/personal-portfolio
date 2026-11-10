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
    id: "2026-11-10-sfl-classroom",
    date: "2026-11-10",
    title: "采集课堂接到七步实验站",
    lead: "课上请走七步实验站 /sfl-lab。旧版 /sfl 已转到这里。阿里云课用机没有在跑。",
    points: [
      "课上主入口：智慧水利总览第一张卡就是微型蒸渗仪，标成已上线。作业台「蒸渗仪」直接打开七步，不再嵌旧静态页。",
      "课上第一步改为「载入课堂示例」。上传实测、自由作图都是选做，不要一上来让学生找 CSV。",
      "面试五分钟导览仍是：室内作业 → 一张图 → 态势 → 产汇流 → 论证文档。和课上采集主路径分开。",
      "阿里云目前只有 ECS 脚本，没有正在运行的课用实例。老师和学生请用本站 /sfl-lab。",
    ],
  },
];

export const CURRENT_UPDATE = SITE_UPDATES[0];
