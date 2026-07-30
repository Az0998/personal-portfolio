export type QType = "single" | "multi" | "scale" | "text";

export type Question = {
  id: string;
  type: QType;
  title: string;
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
};

export type Survey = {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "private";
  accessCode?: string;
  resultsShare: "owner" | "snapshot";
  status: "draft" | "open" | "closed";
  questions: Question[];
  createdAt: string;
  template?: "mentor" | "school" | "blank";
};

export type SurveyResponse = {
  id: string;
  surveyId: string;
  answers: Record<string, string | string[] | number>;
  submittedAt: string;
};

/** Anonymous discussion post — no real name / account. */
export type DiscussionPost = {
  id: string;
  surveyId: string;
  alias: string;
  body: string;
  createdAt: string;
  replyTo?: string;
};

export type Persisted = {
  surveys: Survey[];
  responses: SurveyResponse[];
  posts: DiscussionPost[];
  logs: string[];
};

export type DistBucket = { label: string; count: number; pct: number };

export type QuestionAgg = {
  questionId: string;
  title: string;
  type: QType;
  answered: number;
  mean?: number;
  distribution?: DistBucket[];
  texts?: string[];
};

export type Aggregate = {
  surveyId: string;
  title: string;
  total: number;
  questions: QuestionAgg[];
  generatedAt: string;
};

export type SurveyDefPayload = {
  v: 1;
  kind: "survey-def";
  survey: Omit<Survey, "createdAt" | "status"> & {
    createdAt?: string;
    status?: Survey["status"];
  };
};

export type ResponsePayload = {
  v: 1;
  kind: "response";
  response: SurveyResponse;
};

export type SnapshotPayload = {
  v: 1;
  kind: "snapshot";
  aggregate: Aggregate;
  redactTexts?: boolean;
};

export type DiscussPackPayload = {
  v: 1;
  kind: "discuss-pack";
  surveyId: string;
  surveyTitle: string;
  posts: DiscussionPost[];
};

export const STORAGE_KEY = "anon-survey:v1";

const ALIAS_WORDS = [
  "青苔",
  "雾灯",
  "溪石",
  "纸鸢",
  "北窗",
  "潮痕",
  "静港",
  "麦浪",
  "星轨",
  "苔原",
  "听雨",
  "远岸",
];

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  let tail = "";
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${prefix}-${tail}`;
}

export function makeAnonAlias() {
  const word = ALIAS_WORDS[Math.floor(Math.random() * ALIAS_WORDS.length)];
  let tail = "";
  for (let i = 0; i < 3; i++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${word}·${tail}`;
}

export function defaultState(): Persisted {
  return { surveys: [], responses: [], posts: [], logs: [] };
}

export function loadState(): Persisted {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Persisted;
    return {
      surveys: Array.isArray(parsed.surveys) ? parsed.surveys : [],
      responses: Array.isArray(parsed.responses) ? parsed.responses : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: Persisted) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function utf8ToB64(str: string) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64ToUtf8(b64: string) {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePayload(
  payload: SurveyDefPayload | ResponsePayload | SnapshotPayload | DiscussPackPayload,
) {
  return utf8ToB64(JSON.stringify(payload));
}

export function decodePayload(
  code: string,
): SurveyDefPayload | ResponsePayload | SnapshotPayload | DiscussPackPayload | null {
  try {
    const trimmed = code.trim().replace(/^AS[1234]-/i, "");
    const obj = JSON.parse(b64ToUtf8(trimmed)) as { kind?: string; v?: number };
    if (obj.v !== 1 || !obj.kind) return null;
    if (
      obj.kind === "survey-def" ||
      obj.kind === "response" ||
      obj.kind === "snapshot" ||
      obj.kind === "discuss-pack"
    ) {
      return obj as SurveyDefPayload | ResponsePayload | SnapshotPayload | DiscussPackPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeSurveyDef(survey: Survey) {
  const payload: SurveyDefPayload = {
    v: 1,
    kind: "survey-def",
    survey: {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      visibility: survey.visibility,
      accessCode: survey.accessCode,
      resultsShare: survey.resultsShare,
      questions: survey.questions,
      template: survey.template,
      status: survey.status,
      createdAt: survey.createdAt,
    },
  };
  return `AS1-${encodePayload(payload)}`;
}

export function encodeResponse(response: SurveyResponse) {
  return `AS2-${encodePayload({ v: 1, kind: "response", response })}`;
}

export function encodeSnapshot(aggregate: Aggregate, redactTexts = false) {
  const agg: Aggregate = redactTexts
    ? {
        ...aggregate,
        questions: aggregate.questions.map((q) =>
          q.type === "text" ? { ...q, texts: q.texts?.map(() => "（已脱敏）") } : q,
        ),
      }
    : aggregate;
  return `AS3-${encodePayload({ v: 1, kind: "snapshot", aggregate: agg, redactTexts })}`;
}

export function encodeDiscussPack(survey: Survey, posts: DiscussionPost[]) {
  const list = posts.filter((p) => p.surveyId === survey.id);
  return `AS4-${encodePayload({
    v: 1,
    kind: "discuss-pack",
    surveyId: survey.id,
    surveyTitle: survey.title,
    posts: list,
  })}`;
}

export function postsFor(surveyId: string, posts: DiscussionPost[]) {
  return posts
    .filter((p) => p.surveyId === surveyId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createDiscussionPost(
  surveyId: string,
  body: string,
  replyTo?: string,
): DiscussionPost | null {
  const text = body.trim();
  if (!text || text.length > 800) return null;
  return {
    id: makeId("DP"),
    surveyId,
    alias: makeAnonAlias(),
    body: text.slice(0, 800),
    createdAt: nowIso(),
    replyTo,
  };
}

export function responsesFor(surveyId: string, responses: SurveyResponse[]) {
  return responses.filter((r) => r.surveyId === surveyId);
}

export function aggregateSurvey(survey: Survey, responses: SurveyResponse[]): Aggregate {
  const list = responsesFor(survey.id, responses);
  const questions: QuestionAgg[] = survey.questions.map((question) => {
    const values = list
      .map((r) => r.answers[question.id])
      .filter((v) => v !== undefined && v !== null && v !== "");

    if (question.type === "scale") {
      const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined;
      const min = question.scaleMin ?? 1;
      const max = question.scaleMax ?? 5;
      const distribution: DistBucket[] = [];
      for (let i = min; i <= max; i++) {
        const count = nums.filter((n) => n === i).length;
        distribution.push({
          label: String(i),
          count,
          pct: nums.length ? (count / nums.length) * 100 : 0,
        });
      }
      return {
        questionId: question.id,
        title: question.title,
        type: question.type,
        answered: nums.length,
        mean: mean !== undefined ? Math.round(mean * 100) / 100 : undefined,
        distribution,
      };
    }

    if (question.type === "single" || question.type === "multi") {
      const opts = question.options ?? [];
      const flat: string[] = [];
      values.forEach((v) => {
        if (Array.isArray(v)) flat.push(...v.map(String));
        else flat.push(String(v));
      });
      const distribution = opts.map((label) => {
        const count = flat.filter((x) => x === label).length;
        return {
          label,
          count,
          pct: flat.length ? (count / flat.length) * 100 : 0,
        };
      });
      return {
        questionId: question.id,
        title: question.title,
        type: question.type,
        answered: values.length,
        distribution,
      };
    }

    const texts = values.map(String).filter((t) => t.trim());
    return {
      questionId: question.id,
      title: question.title,
      type: "text",
      answered: texts.length,
      texts,
    };
  });

  return {
    surveyId: survey.id,
    title: survey.title,
    total: list.length,
    questions,
    generatedAt: nowIso(),
  };
}

export function exportCsv(survey: Survey, responses: SurveyResponse[]) {
  const list = responsesFor(survey.id, responses);
  const headers = ["responseId", "submittedAt", ...survey.questions.map((q) => q.title)];
  const rows = list.map((r) => {
    const cells = survey.questions.map((q) => {
      const v = r.answers[q.id];
      if (v === undefined || v === null) return "";
      if (Array.isArray(v)) return v.join("|");
      return String(v);
    });
    return [r.id, r.submittedAt, ...cells];
  });
  const escape = (cell: string) => {
    if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
    return cell;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export function simulateResponses(survey: Survey, n: number): SurveyResponse[] {
  const out: SurveyResponse[] = [];
  for (let i = 0; i < n; i++) {
    const answers: SurveyResponse["answers"] = {};
    survey.questions.forEach((q) => {
      if (q.type === "scale") {
        const min = q.scaleMin ?? 1;
        const max = q.scaleMax ?? 5;
        answers[q.id] = min + Math.floor(Math.random() * (max - min + 1));
      } else if (q.type === "single") {
        const opts = q.options ?? ["A"];
        answers[q.id] = opts[Math.floor(Math.random() * opts.length)];
      } else if (q.type === "multi") {
        const opts = q.options ?? [];
        const picked = opts.filter(() => Math.random() > 0.55);
        answers[q.id] = picked.length ? picked : opts.slice(0, 1);
      } else if (!q.required || Math.random() > 0.3) {
        const samples = ["节奏刚好", "希望更多反馈", "整体满意", "可以加强沟通", ""];
        const t = samples[Math.floor(Math.random() * samples.length)];
        if (t) answers[q.id] = t;
      }
    });
    out.push({
      id: makeId("RS"),
      surveyId: survey.id,
      answers,
      submittedAt: nowIso(),
    });
  }
  return out;
}

export function validateAnswers(
  survey: Survey,
  answers: SurveyResponse["answers"],
): string | null {
  for (const q of survey.questions) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (v === undefined || v === null || v === "") return `请完成：${q.title}`;
    if (Array.isArray(v) && v.length === 0) return `请完成：${q.title}`;
  }
  return null;
}

export function canSeeQuestions(survey: Survey, accessCodeInput: string) {
  if (survey.visibility === "public") return true;
  return (survey.accessCode || "") === accessCodeInput;
}

export function fillProgress(survey: Survey, answers: SurveyResponse["answers"]) {
  const total = survey.questions.length || 1;
  const done = survey.questions.filter((q) => {
    const v = answers[q.id];
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
  return Math.round((done / total) * 100);
}
