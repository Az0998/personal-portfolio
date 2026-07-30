import type { Question, Survey } from "./storage";

function q(
  id: string,
  type: Question["type"],
  title: string,
  extra: Partial<Question> = {},
): Question {
  return {
    id,
    type,
    title,
    required: true,
    ...extra,
  };
}

export const MENTOR_QUESTIONS: Question[] = [
  q("m1", "scale", "指导频率是否足够？", { scaleMin: 1, scaleMax: 5 }),
  q("m2", "scale", "反馈是否及时？", { scaleMin: 1, scaleMax: 5 }),
  q("m3", "scale", "学术帮助程度", { scaleMin: 1, scaleMax: 5 }),
  q("m4", "scale", "沟通氛围", { scaleMin: 1, scaleMax: 5 }),
  q("m5", "single", "总体评价", {
    options: ["优秀", "良好", "一般", "需改进"],
  }),
  q("m6", "text", "一句建议（可选）", { required: false }),
];

export const SCHOOL_QUESTIONS: Question[] = [
  q("s1", "scale", "课程质量", { scaleMin: 1, scaleMax: 5 }),
  q("s2", "scale", "教学设施", { scaleMin: 1, scaleMax: 5 }),
  q("s3", "scale", "支持服务（教务/心理/就业等）", { scaleMin: 1, scaleMax: 5 }),
  q("s4", "single", "总体满意度", {
    options: ["非常满意", "满意", "一般", "不满意"],
  }),
  q("s5", "multi", "你最看重的改进方向（可多选）", {
    options: ["课程设置", "实验条件", "导师匹配", "校园生活", "就业指导"],
    required: false,
  }),
  q("s6", "text", "改进建议", { required: false }),
];

export type TemplateId = "mentor" | "school" | "blank";

export function templateMeta(id: TemplateId): {
  title: string;
  description: string;
  questions: Question[];
} {
  if (id === "mentor") {
    return {
      title: "导师评价（匿名）",
      description: "匿名收集对导师指导频率、反馈与沟通的评价，结果可汇总分享。",
      questions: MENTOR_QUESTIONS.map((x) => ({ ...x })),
    };
  }
  if (id === "school") {
    return {
      title: "学校评价（匿名）",
      description: "匿名收集课程、设施与支持服务评价，适合院系或班级内部汇总。",
      questions: SCHOOL_QUESTIONS.map((x) => ({ ...x })),
    };
  }
  return {
    title: "未命名问卷",
    description: "",
    questions: [
      q("q1", "scale", "总体满意度", { scaleMin: 1, scaleMax: 5 }),
      q("q2", "text", "补充说明", { required: false }),
    ],
  };
}

export function applyTemplateFields(
  survey: Pick<Survey, "title" | "description" | "questions" | "template">,
  id: TemplateId,
) {
  const meta = templateMeta(id);
  return {
    ...survey,
    title: meta.title,
    description: meta.description,
    questions: meta.questions,
    template: id,
  };
}
