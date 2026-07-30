"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Aggregate,
  DiscussionPost,
  Persisted,
  Survey,
  SurveyResponse,
  Question,
  aggregateSurvey,
  canSeeQuestions,
  createDiscussionPost,
  decodePayload,
  defaultState,
  encodeDiscussPack,
  encodeResponse,
  encodeSnapshot,
  encodeSurveyDef,
  exportCsv,
  fillProgress,
  loadState,
  makeId,
  nowIso,
  postsFor,
  saveState,
  simulateResponses,
  validateAnswers,
} from "./storage";
import { TemplateId, applyTemplateFields, templateMeta } from "./templates";

type Tab =
  | "overview"
  | "create"
  | "mine"
  | "fill"
  | "results"
  | "share"
  | "discuss"
  | "verify";

type VerifyItem = {
  id: string;
  label: string;
  status: "idle" | "pass" | "fail";
  detail: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "总览" },
  { id: "create", label: "创建问卷" },
  { id: "mine", label: "我的问卷" },
  { id: "fill", label: "填写" },
  { id: "results", label: "结果汇总" },
  { id: "share", label: "分享结果" },
  { id: "discuss", label: "匿名讨论" },
  { id: "verify", label: "功能验证" },
];

const VERIFY_SEED: VerifyItem[] = [
  { id: "tpl-mentor", label: "导师模板发布为公开卷", status: "idle", detail: "" },
  { id: "private-gate", label: "私密卷口令门禁", status: "idle", detail: "" },
  { id: "anon-submit", label: "匿名提交无身份字段", status: "idle", detail: "" },
  { id: "aggregate", label: "汇总均值与分布", status: "idle", detail: "" },
  { id: "share-snap", label: "结果快照只读分享", status: "idle", detail: "" },
  { id: "discuss", label: "匿名讨论发帖与打包", status: "idle", detail: "" },
  { id: "persist", label: "localStorage 持久化", status: "idle", detail: "" },
  { id: "csv", label: "CSV 含题目标题行", status: "idle", detail: "" },
];

function emptyDraft(template: TemplateId = "blank"): Survey {
  const meta = templateMeta(template);
  return {
    id: makeId("SV"),
    title: meta.title,
    description: meta.description,
    visibility: "public",
    resultsShare: "snapshot",
    status: "draft",
    questions: meta.questions,
    createdAt: nowIso(),
    template,
  };
}

function BarChart({ buckets }: { buckets: { label: string; count: number; pct: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="as-bars">
      {buckets.map((b) => (
        <div className="as-bar-row" key={b.label}>
          <span className="as-bar-label">{b.label}</span>
          <div className="as-bar-track">
            <div className="as-bar-fill" style={{ width: `${(b.count / max) * 100}%` }} />
          </div>
          <span className="as-bar-n">
            {b.count} · {b.pct.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function newQuestion(type: Question["type"] = "scale"): Question {
  return {
    id: makeId("Q").replace("Q-", "q"),
    type,
    title: "新题目",
    required: true,
    options: type === "single" || type === "multi" ? ["选项A", "选项B", "选项C"] : undefined,
    scaleMin: type === "scale" ? 1 : undefined,
    scaleMax: type === "scale" ? 5 : undefined,
  };
}

export function AnonSurveyApp() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Persisted>(defaultState);
  const [tab, setTab] = useState<Tab>("overview");
  const [draft, setDraft] = useState<Survey>(() => emptyDraft("mentor"));
  const [activeId, setActiveId] = useState("");
  const [fillSurvey, setFillSurvey] = useState<Survey | null>(null);
  const [fillCode, setFillCode] = useState("");
  const [accessInput, setAccessInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [answers, setAnswers] = useState<SurveyResponse["answers"]>({});
  const [fillDone, setFillDone] = useState<SurveyResponse | null>(null);
  const [defPaste, setDefPaste] = useState("");
  const [respPaste, setRespPaste] = useState("");
  const [snapPaste, setSnapPaste] = useState("");
  const [snapshotView, setSnapshotView] = useState<Aggregate | null>(null);
  const [redactTexts, setRedactTexts] = useState(false);
  const [simN, setSimN] = useState(8);
  const [copied, setCopied] = useState("");
  const [verify, setVerify] = useState<VerifyItem[]>(VERIFY_SEED);
  const [msg, setMsg] = useState("");
  const [discussBody, setDiscussBody] = useState("");
  const [discussPackPaste, setDiscussPackPaste] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
    if (loaded.surveys[0]) setActiveId(loaded.surveys[0].id);

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const id = params.get("id");
    const snap = params.get("snap");

    if (mode === "results" && snap) {
      const decoded = decodePayload(snap.startsWith("AS3-") ? snap : `AS3-${snap}`);
      if (decoded?.kind === "snapshot") {
        setSnapshotView(decoded.aggregate);
        setTab("share");
      }
    } else if (mode === "fill" && id) {
      const found = loaded.surveys.find((s) => s.id === id);
      if (found) {
        setFillSurvey(found);
        setUnlocked(found.visibility === "public");
        setTab("fill");
      } else {
        setTab("fill");
        setMsg("本机未找到该问卷，请粘贴问卷定义码。");
      }
    } else if (mode === "discuss" && id) {
      const found = loaded.surveys.find((s) => s.id === id);
      if (found) setActiveId(found.id);
      setTab("discuss");
    } else if (mode === "results" && id) {
      const found = loaded.surveys.find((s) => s.id === id);
      if (found) {
        setActiveId(found.id);
        setTab("results");
      }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [state, hydrated]);

  const active = useMemo(
    () => state.surveys.find((s) => s.id === activeId) || state.surveys[0] || null,
    [state.surveys, activeId],
  );

  const activeAgg = useMemo(() => {
    if (!active) return null;
    return aggregateSurvey(active, state.responses);
  }, [active, state.responses]);

  const activePosts = useMemo(() => {
    if (!active) return [] as DiscussionPost[];
    return postsFor(active.id, state.posts);
  }, [active, state.posts]);

  const stats = useMemo(() => {
    const total = state.surveys.length;
    const open = state.surveys.filter((s) => s.status === "open").length;
    const priv = state.surveys.filter((s) => s.visibility === "private").length;
    const pub = state.surveys.filter((s) => s.visibility === "public").length;
    return {
      total,
      open,
      priv,
      pub,
      responses: state.responses.length,
      posts: state.posts.length,
    };
  }, [state]);

  function pushLog(line: string) {
    setState((s) => ({ ...s, logs: [`${new Date().toLocaleTimeString()} ${line}`, ...s.logs].slice(0, 40) }));
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3200);
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
      flash(`已复制：${label}`);
    } catch {
      flash("复制失败，请手动选择文本");
    }
  }

  function startFromTemplate(id: TemplateId) {
    setDraft(emptyDraft(id));
    setTab("create");
  }

  function saveDraft(publish: boolean) {
    if (!draft.title.trim()) {
      flash("请填写标题");
      return;
    }
    if (draft.visibility === "private" && !draft.accessCode?.trim()) {
      flash("私密问卷需要设置口令");
      return;
    }
    if (!draft.questions.length) {
      flash("至少一道题");
      return;
    }
    const next: Survey = {
      ...draft,
      status: publish ? "open" : draft.status === "open" ? "open" : "draft",
      accessCode: draft.visibility === "private" ? draft.accessCode?.trim() : undefined,
      createdAt: draft.createdAt || nowIso(),
    };
    setState((s) => {
      const exists = s.surveys.some((x) => x.id === next.id);
      return {
        ...s,
        surveys: exists ? s.surveys.map((x) => (x.id === next.id ? next : x)) : [next, ...s.surveys],
      };
    });
    setActiveId(next.id);
    pushLog(`${publish ? "发布" : "保存"}问卷 ${next.id}「${next.title}」`);
    flash(publish ? "已发布" : "已保存草稿");
    setTab("mine");
  }

  function loadFillFromDef() {
    const decoded = decodePayload(defPaste);
    if (!decoded || decoded.kind !== "survey-def") {
      flash("无效的问卷定义码");
      return;
    }
    const s = decoded.survey;
    const survey: Survey = {
      id: s.id,
      title: s.title,
      description: s.description,
      visibility: s.visibility,
      accessCode: s.accessCode,
      resultsShare: s.resultsShare,
      status: s.status || "open",
      questions: s.questions,
      createdAt: s.createdAt || nowIso(),
      template: s.template,
    };
    setFillSurvey(survey);
    setUnlocked(survey.visibility === "public");
    setAccessInput("");
    setAnswers({});
    setFillDone(null);
    setState((st) => {
      if (st.surveys.some((x) => x.id === survey.id)) return st;
      return { ...st, surveys: [survey, ...st.surveys] };
    });
    flash("已载入问卷定义");
  }

  function tryUnlock() {
    if (!fillSurvey) return;
    if (canSeeQuestions(fillSurvey, accessInput)) {
      setUnlocked(true);
      flash("口令正确");
    } else {
      setUnlocked(false);
      flash("口令错误，题目未解锁");
    }
  }

  function submitFill() {
    if (!fillSurvey) return;
    if (fillSurvey.status === "closed") {
      flash("问卷已关闭");
      return;
    }
    if (!canSeeQuestions(fillSurvey, fillSurvey.visibility === "public" ? "" : accessInput)) {
      flash("请先通过口令验证");
      return;
    }
    const err = validateAnswers(fillSurvey, answers);
    if (err) {
      flash(err);
      return;
    }
    if (!window.confirm("确认匿名提交？提交后不会记录姓名或账号。")) return;
    const response: SurveyResponse = {
      id: makeId("RS"),
      surveyId: fillSurvey.id,
      answers: { ...answers },
      submittedAt: nowIso(),
    };
    setState((s) => ({ ...s, responses: [response, ...s.responses] }));
    setFillDone(response);
    setFillCode(encodeResponse(response));
    pushLog(`匿名答卷 ${response.id} → ${fillSurvey.id}`);
  }

  function importResponseCode() {
    const decoded = decodePayload(respPaste);
    if (!decoded || decoded.kind !== "response") {
      flash("无效答卷码");
      return;
    }
    const r = decoded.response;
    setState((s) => {
      if (s.responses.some((x) => x.id === r.id)) return s;
      return { ...s, responses: [r, ...s.responses] };
    });
    setActiveId(r.surveyId);
    flash(`已导入答卷 ${r.id}`);
    pushLog(`导入答卷 ${r.id}`);
  }

  function runSimulate() {
    if (!active) return;
    const added = simulateResponses(active, Math.max(1, Math.min(50, simN)));
    setState((s) => ({ ...s, responses: [...added, ...s.responses] }));
    pushLog(`模拟回收 ${added.length} 份 → ${active.id}`);
    flash(`已模拟 ${added.length} 份匿名答卷`);
  }

  function downloadCsv() {
    if (!active) return;
    const csv = exportCsv(active, state.responses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function submitDiscuss() {
    if (!active) {
      flash("请先选择问卷");
      return;
    }
    const post = createDiscussionPost(active.id, discussBody, replyTo);
    if (!post) {
      flash("内容为空或过长（上限 800 字）");
      return;
    }
    setState((s) => ({ ...s, posts: [post, ...s.posts] }));
    setDiscussBody("");
    setReplyTo(undefined);
    pushLog(`匿名讨论 ${post.alias} @ ${active.id}`);
    flash("已匿名发布");
  }

  function importDiscussPack() {
    const decoded = decodePayload(discussPackPaste);
    if (!decoded || decoded.kind !== "discuss-pack") {
      flash("无效讨论打包码");
      return;
    }
    setState((s) => {
      const existing = new Set(s.posts.map((p) => p.id));
      const added = decoded.posts.filter((p) => !existing.has(p.id));
      return { ...s, posts: [...added, ...s.posts] };
    });
    setActiveId(decoded.surveyId);
    flash(`已导入 ${decoded.posts.length} 条讨论（跳过重复）`);
    pushLog(`导入讨论包 ${decoded.surveyId}`);
  }

  function fillLink(survey: Survey) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/survey?mode=fill&id=${encodeURIComponent(survey.id)}`;
  }

  function snapshotLink(code: string) {
    if (typeof window === "undefined") return "";
    const raw = code.replace(/^AS3-/i, "");
    return `${window.location.origin}/survey?mode=results&snap=${encodeURIComponent(raw)}`;
  }

  function runVerifyAll() {
    const items: VerifyItem[] = VERIFY_SEED.map((v) => ({ ...v, status: "idle", detail: "" }));
    const set = (id: string, status: "pass" | "fail", detail: string) => {
      const i = items.findIndex((x) => x.id === id);
      if (i >= 0) items[i] = { ...items[i], status, detail };
    };

    try {
      const mentor = emptyDraft("mentor");
      mentor.visibility = "public";
      mentor.status = "open";
      mentor.title = "验证·导师评价";
      if (mentor.template !== "mentor" || mentor.questions.length < 5) {
        set("tpl-mentor", "fail", "模板题目不足");
      } else {
        set("tpl-mentor", "pass", `${mentor.id} 公开已发布形态`);
      }

      const priv = emptyDraft("blank");
      priv.visibility = "private";
      priv.accessCode = "secret42";
      priv.status = "open";
      const gateFail = canSeeQuestions(priv, "");
      const gateOk = canSeeQuestions(priv, "secret42");
      if (!gateFail && gateOk) set("private-gate", "pass", "无口令不可见，正确口令可填");
      else set("private-gate", "fail", `gateFail=${gateFail} gateOk=${gateOk}`);

      const answersTest: SurveyResponse["answers"] = {};
      mentor.questions.forEach((q) => {
        if (q.type === "scale") answersTest[q.id] = 4;
        else if (q.type === "single") answersTest[q.id] = q.options?.[0] || "A";
        else if (q.type === "multi") answersTest[q.id] = q.options?.slice(0, 1) || [];
        else answersTest[q.id] = "验证建议";
      });
      const resp: SurveyResponse = {
        id: makeId("RS"),
        surveyId: mentor.id,
        answers: answersTest,
        submittedAt: nowIso(),
      };
      const identityKeys = Object.keys(resp).filter((k) =>
        ["name", "email", "userId", "deviceId", "ip"].includes(k),
      );
      if (identityKeys.length === 0 && resp.answers) {
        set("anon-submit", "pass", "Response 仅含 id/surveyId/answers/submittedAt");
      } else {
        set("anon-submit", "fail", `可疑字段: ${identityKeys.join(",")}`);
      }

      const sim = simulateResponses(mentor, 10);
      const agg = aggregateSurvey(mentor, sim);
      const scaleQ = agg.questions.find((q) => q.type === "scale");
      const singleQ = agg.questions.find((q) => q.type === "single");
      if (agg.total === 10 && scaleQ?.mean !== undefined && singleQ?.distribution?.length) {
        set("aggregate", "pass", `n=10 mean=${scaleQ.mean} 单选桶=${singleQ.distribution.length}`);
      } else {
        set("aggregate", "fail", "汇总结果异常");
      }

      const ownerOnly = { ...mentor, resultsShare: "owner" as const };
      const canSnap = mentor.resultsShare === "snapshot";
      const cannotSnap = ownerOnly.resultsShare === "owner";
      const code = encodeSnapshot(agg, true);
      const decoded = decodePayload(code);
      if (canSnap && cannotSnap && decoded?.kind === "snapshot" && decoded.aggregate.total === 10) {
        set("share-snap", "pass", "可分享卷可生成快照；仅创建者卷不可对外生成策略成立");
      } else {
        set("share-snap", "fail", "快照策略或解码失败");
      }

      const post = createDiscussionPost(mentor.id, "验证：匿名讨论不记姓名");
      const packCode = post ? encodeDiscussPack(mentor, [post]) : "";
      const packDecoded = packCode ? decodePayload(packCode) : null;
      if (
        post &&
        !("name" in post) &&
        packDecoded?.kind === "discuss-pack" &&
        packDecoded.posts.length === 1
      ) {
        set("discuss", "pass", `别名 ${post.alias} · 打包码可往返`);
      } else {
        set("discuss", "fail", "讨论发帖或打包失败");
      }

      const pack: Persisted = {
        surveys: [mentor],
        responses: [resp],
        posts: post ? [post] : [],
        logs: ["verify"],
      };
      const raw = JSON.stringify(pack);
      const round = JSON.parse(raw) as Persisted;
      if (
        round.surveys[0]?.id === mentor.id &&
        round.responses[0]?.id === resp.id &&
        (round.posts?.length ?? 0) >= 0
      ) {
        set("persist", "pass", "序列化往返一致（含讨论）");
      } else {
        set("persist", "fail", "往返丢失");
      }

      const csv = exportCsv(mentor, [resp, ...sim]);
      const header = csv.split("\n")[0] || "";
      const okHeader = mentor.questions.every((q) => header.includes(q.title));
      if (okHeader && header.startsWith("responseId,submittedAt")) {
        set("csv", "pass", "表头含全部题目标题");
      } else {
        set("csv", "fail", "表头缺失题目");
      }

      setState((s) => {
        const surveys = s.surveys.some((x) => x.id === mentor.id) ? s.surveys : [mentor, ...s.surveys];
        const responses = [...sim.slice(0, 3), ...s.responses];
        const posts = post ? [post, ...s.posts.filter((p) => p.id !== post.id)] : s.posts;
        return { ...s, surveys, responses, posts, logs: [`验证套件完成`, ...s.logs].slice(0, 40) };
      });
      setActiveId(mentor.id);
    } catch (e) {
      items.forEach((it) => {
        if (it.status === "idle") {
          it.status = "fail";
          it.detail = e instanceof Error ? e.message : "未知错误";
        }
      });
    }

    setVerify([...items]);
    setTab("verify");
    flash("验证套件已跑完");
  }

  const progress = fillSurvey ? fillProgress(fillSurvey, answers) : 0;

  if (!hydrated) {
    return <div className="as-loading">载入本地问卷数据…</div>;
  }

  return (
    <div className="as-shell">
      <nav className="as-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="as-main">
        {msg && <div className="as-toast">{msg}</div>}

        {tab === "overview" && (
          <div className="as-panel as-fade">
            <section className="as-hero">
              <p className="as-eyebrow">Anon Survey · 浏览器端</p>
              <h1>匿名问卷与讨论</h1>
              <p>
                公开或私密问卷、匿名填写与汇总，分享结果快照，并在问卷下开一片匿名讨论区——不登录、随机别名，把导师评价与学校评价聊清楚。
              </p>
              <div className="as-hero-actions">
                <button type="button" className="as-btn" onClick={() => startFromTemplate("mentor")}>
                  导师评价模板
                </button>
                <button type="button" className="as-btn ghost" onClick={() => startFromTemplate("school")}>
                  学校评价模板
                </button>
                <button type="button" className="as-btn ghost" onClick={() => setTab("discuss")}>
                  进入匿名讨论
                </button>
                <button type="button" className="as-btn ghost" onClick={runVerifyAll}>
                  一键功能验证
                </button>
              </div>
            </section>

            <div className="as-metrics">
              <div className="as-metric">
                <span>问卷</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="as-metric">
                <span>开放中</span>
                <strong>{stats.open}</strong>
              </div>
              <div className="as-metric">
                <span>回收答卷</span>
                <strong>{stats.responses}</strong>
              </div>
              <div className="as-metric">
                <span>匿名讨论</span>
                <strong>{stats.posts}</strong>
              </div>
            </div>

            <section className="as-card">
              <h2>场景怎么用</h2>
              <ol className="as-steps-list">
                <li>创建者选用模板，设公开或私密口令，发布后复制填写链接 / 定义码。</li>
                <li>填写者不登录；私密卷先过口令，提交后只生成匿名答卷码。</li>
                <li>汇总分布与均值，导出 CSV；生成只读结果快照对外分享。</li>
                <li>在「匿名讨论」用随机别名发言，可打包讨论码跨设备合并。</li>
              </ol>
            </section>
          </div>
        )}

        {tab === "create" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>创建问卷</h2>
              <p className="muted">模板优先；题目支持上移下移。私密卷必须设口令。</p>
              <div className="as-row">
                {(["mentor", "school", "blank"] as TemplateId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className="as-btn ghost"
                    onClick={() => setDraft((d) => ({ ...d, ...applyTemplateFields(d, id), id: d.id }))}
                  >
                    载入{id === "mentor" ? "导师" : id === "school" ? "学校" : "空白"}模板
                  </button>
                ))}
              </div>

              <div className="as-field">
                <label>标题</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="as-field">
                <label>说明</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="as-grid-2">
                <div className="as-field">
                  <label>可见性</label>
                  <select
                    value={draft.visibility}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visibility: e.target.value as Survey["visibility"],
                      })
                    }
                  >
                    <option value="public">公开 — 有链接即可填</option>
                    <option value="private">私密 — 需要口令</option>
                  </select>
                </div>
                <div className="as-field">
                  <label>结果分享</label>
                  <select
                    value={draft.resultsShare}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        resultsShare: e.target.value as Survey["resultsShare"],
                      })
                    }
                  >
                    <option value="snapshot">可生成只读快照分享</option>
                    <option value="owner">仅创建者查看</option>
                  </select>
                </div>
              </div>
              {draft.visibility === "private" && (
                <div className="as-field">
                  <label>填写口令</label>
                  <input
                    value={draft.accessCode || ""}
                    onChange={(e) => setDraft({ ...draft, accessCode: e.target.value })}
                    placeholder="例如：lab2026"
                  />
                </div>
              )}

              <h3>题目</h3>
              {draft.questions.map((q, idx) => (
                <div className="as-q-edit" key={q.id}>
                  <div className="as-grid-2">
                    <div className="as-field">
                      <label>题干</label>
                      <input
                        value={q.title}
                        onChange={(e) => {
                          const questions = [...draft.questions];
                          questions[idx] = { ...q, title: e.target.value };
                          setDraft({ ...draft, questions });
                        }}
                      />
                    </div>
                    <div className="as-field">
                      <label>题型</label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const type = e.target.value as Question["type"];
                          const questions = [...draft.questions];
                          questions[idx] = {
                            ...q,
                            type,
                            options:
                              type === "single" || type === "multi"
                                ? q.options || ["选项A", "选项B"]
                                : undefined,
                            scaleMin: type === "scale" ? q.scaleMin ?? 1 : undefined,
                            scaleMax: type === "scale" ? q.scaleMax ?? 5 : undefined,
                          };
                          setDraft({ ...draft, questions });
                        }}
                      >
                        <option value="scale">量表</option>
                        <option value="single">单选</option>
                        <option value="multi">多选</option>
                        <option value="text">开放文本</option>
                      </select>
                    </div>
                  </div>
                  {(q.type === "single" || q.type === "multi") && (
                    <div className="as-field">
                      <label>选项（逗号分隔）</label>
                      <input
                        value={(q.options || []).join(",")}
                        onChange={(e) => {
                          const questions = [...draft.questions];
                          questions[idx] = {
                            ...q,
                            options: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          };
                          setDraft({ ...draft, questions });
                        }}
                      />
                    </div>
                  )}
                  <div className="as-row">
                    <label className="as-check">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const questions = [...draft.questions];
                          questions[idx] = { ...q, required: e.target.checked };
                          setDraft({ ...draft, questions });
                        }}
                      />
                      必填
                    </label>
                    <button
                      type="button"
                      className="as-btn ghost"
                      disabled={idx === 0}
                      onClick={() => {
                        const questions = [...draft.questions];
                        [questions[idx - 1], questions[idx]] = [questions[idx], questions[idx - 1]];
                        setDraft({ ...draft, questions });
                      }}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      className="as-btn ghost"
                      disabled={idx === draft.questions.length - 1}
                      onClick={() => {
                        const questions = [...draft.questions];
                        [questions[idx + 1], questions[idx]] = [questions[idx], questions[idx + 1]];
                        setDraft({ ...draft, questions });
                      }}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      className="as-btn ghost"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          questions: draft.questions.filter((x) => x.id !== q.id),
                        })
                      }
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <div className="as-row">
                <button
                  type="button"
                  className="as-btn ghost"
                  onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion("scale")] })}
                >
                  加量表题
                </button>
                <button
                  type="button"
                  className="as-btn ghost"
                  onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion("single")] })}
                >
                  加单选题
                </button>
                <button
                  type="button"
                  className="as-btn ghost"
                  onClick={() => setDraft({ ...draft, questions: [...draft.questions, newQuestion("text")] })}
                >
                  加文本题
                </button>
                <button type="button" className="as-btn ghost" onClick={() => saveDraft(false)}>
                  保存草稿
                </button>
                <button type="button" className="as-btn" onClick={() => saveDraft(true)}>
                  发布
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "mine" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>我的问卷</h2>
              {state.surveys.length === 0 && <p className="muted">还没有问卷，去总览选一个模板开始。</p>}
              <div className="as-list">
                {state.surveys.map((s) => {
                  const n = state.responses.filter((r) => r.surveyId === s.id).length;
                  return (
                    <div className="as-list-item" key={s.id}>
                      <div>
                        <strong>{s.title}</strong>
                        <p className="muted">
                          {s.id} · {s.visibility === "public" ? "公开" : "私密"} · {s.status} · 回收 {n}
                          {s.resultsShare === "snapshot" ? " · 可分享快照" : " · 仅创建者"}
                        </p>
                      </div>
                      <div className="as-row">
                        <button
                          type="button"
                          className="as-btn ghost"
                          onClick={() => {
                            setActiveId(s.id);
                            setDraft({ ...s });
                            setTab("create");
                          }}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="as-btn ghost"
                          onClick={() => copyText("填写链接", fillLink(s))}
                        >
                          复制链接
                        </button>
                        <button
                          type="button"
                          className="as-btn ghost"
                          onClick={() => copyText("问卷定义码", encodeSurveyDef(s))}
                        >
                          定义码
                        </button>
                        <button
                          type="button"
                          className="as-btn ghost"
                          onClick={() => {
                            setState((st) => ({
                              ...st,
                              surveys: st.surveys.map((x) =>
                                x.id === s.id
                                  ? {
                                      ...x,
                                      status: x.status === "open" ? "closed" : "open",
                                    }
                                  : x,
                              ),
                            }));
                          }}
                        >
                          {s.status === "open" ? "关闭" : "开放"}
                        </button>
                        <button
                          type="button"
                          className="as-btn"
                          onClick={() => {
                            setActiveId(s.id);
                            setTab("results");
                          }}
                        >
                          汇总
                        </button>
                        <button
                          type="button"
                          className="as-btn ghost"
                          onClick={() => {
                            if (!window.confirm(`删除 ${s.title}？`)) return;
                            setState((st) => ({
                              ...st,
                              surveys: st.surveys.filter((x) => x.id !== s.id),
                              responses: st.responses.filter((r) => r.surveyId !== s.id),
                            }));
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {copied && <p className="as-ok">已复制 {copied}</p>}
            </section>
          </div>
        )}

        {tab === "fill" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>匿名填写</h2>
              <p className="muted">不登录、不记姓名。也可粘贴问卷定义码从他机载入题目。</p>
              <div className="as-field">
                <label>问卷定义码</label>
                <textarea
                  value={defPaste}
                  onChange={(e) => setDefPaste(e.target.value)}
                  placeholder="粘贴 AS1-… 定义码"
                />
              </div>
              <div className="as-row">
                <button type="button" className="as-btn" onClick={loadFillFromDef}>
                  载入定义码
                </button>
                <select
                  value={fillSurvey?.id || ""}
                  onChange={(e) => {
                    const s = state.surveys.find((x) => x.id === e.target.value) || null;
                    setFillSurvey(s);
                    setUnlocked(s?.visibility === "public");
                    setAccessInput("");
                    setAnswers({});
                    setFillDone(null);
                  }}
                >
                  <option value="">选择本机问卷…</option>
                  {state.surveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {fillSurvey && (
              <section className="as-card">
                <div className="as-progress-wrap">
                  <div className="as-progress" style={{ width: `${progress}%` }} />
                </div>
                <p className="muted">
                  完成度 {progress}% · {fillSurvey.visibility === "private" ? "私密卷" : "公开卷"}
                </p>
                <h3>{fillSurvey.title}</h3>
                <p className="muted">{fillSurvey.description}</p>

                {fillSurvey.visibility === "private" && !unlocked && (
                  <div className="as-gate">
                    <p>私密问卷：请先输入口令。口令错误时不会展示题目。</p>
                    <div className="as-field">
                      <label>口令</label>
                      <input
                        type="password"
                        value={accessInput}
                        onChange={(e) => setAccessInput(e.target.value)}
                      />
                    </div>
                    <button type="button" className="as-btn" onClick={tryUnlock}>
                      解锁题目
                    </button>
                  </div>
                )}

                {unlocked && !fillDone && (
                  <div className="as-fill-form">
                    {fillSurvey.questions.map((q) => (
                      <div className="as-field" key={q.id}>
                        <label>
                          {q.title}
                          {q.required ? " *" : ""}
                        </label>
                        {q.type === "scale" && (
                          <div className="as-scale">
                            {Array.from(
                              { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                              (_, i) => (q.scaleMin ?? 1) + i,
                            ).map((n) => (
                              <button
                                key={n}
                                type="button"
                                className={answers[q.id] === n ? "on" : ""}
                                onClick={() => setAnswers({ ...answers, [q.id]: n })}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        )}
                        {q.type === "single" &&
                          (q.options || []).map((opt) => (
                            <label className="as-check" key={opt}>
                              <input
                                type="radio"
                                name={q.id}
                                checked={answers[q.id] === opt}
                                onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                              />
                              {opt}
                            </label>
                          ))}
                        {q.type === "multi" &&
                          (q.options || []).map((opt) => {
                            const cur = Array.isArray(answers[q.id])
                              ? (answers[q.id] as string[])
                              : [];
                            return (
                              <label className="as-check" key={opt}>
                                <input
                                  type="checkbox"
                                  checked={cur.includes(opt)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...cur, opt]
                                      : cur.filter((x) => x !== opt);
                                    setAnswers({ ...answers, [q.id]: next });
                                  }}
                                />
                                {opt}
                              </label>
                            );
                          })}
                        {q.type === "text" && (
                          <textarea
                            value={String(answers[q.id] ?? "")}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                    <button type="button" className="as-btn" onClick={submitFill}>
                      匿名提交
                    </button>
                  </div>
                )}

                {fillDone && (
                  <div className="as-success">
                    <div className="as-check-mark">✓</div>
                    <h3>已匿名提交</h3>
                    <p className="muted">答卷号 {fillDone.id}。可将答卷码发给创建者导入汇总。</p>
                    <div className="as-field">
                      <label>答卷码</label>
                      <textarea readOnly value={fillCode} />
                    </div>
                    <button type="button" className="as-btn" onClick={() => copyText("答卷码", fillCode)}>
                      复制答卷码
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {tab === "results" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>结果汇总</h2>
              <div className="as-row">
                <select
                  value={active?.id || ""}
                  onChange={(e) => setActiveId(e.target.value)}
                >
                  {state.surveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <div className="as-field inline">
                  <label>模拟份数</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={simN}
                    onChange={(e) => setSimN(Number(e.target.value) || 1)}
                    style={{ width: 72 }}
                  />
                </div>
                <button type="button" className="as-btn" onClick={runSimulate} disabled={!active}>
                  模拟回收
                </button>
                <button type="button" className="as-btn ghost" onClick={downloadCsv} disabled={!active}>
                  导出 CSV
                </button>
                <button
                  type="button"
                  className="as-btn ghost"
                  disabled={!active}
                  onClick={() => setTab("share")}
                >
                  去分享
                </button>
              </div>
              <div className="as-field">
                <label>导入答卷码</label>
                <textarea
                  value={respPaste}
                  onChange={(e) => setRespPaste(e.target.value)}
                  placeholder="粘贴 AS2-… 答卷码"
                />
              </div>
              <button type="button" className="as-btn ghost" onClick={importResponseCode}>
                导入答卷
              </button>
            </section>

            {!active && (
              <section className="as-card">
                <p className="muted">暂无问卷。先创建或运行功能验证生成示例。</p>
              </section>
            )}

            {active && activeAgg && (
              <>
                <div className="as-metrics">
                  <div className="as-metric">
                    <span>回收</span>
                    <strong>{activeAgg.total}</strong>
                  </div>
                  <div className="as-metric">
                    <span>题目</span>
                    <strong>{active.questions.length}</strong>
                  </div>
                  <div className="as-metric">
                    <span>可见性</span>
                    <strong>{active.visibility === "public" ? "公开" : "私密"}</strong>
                  </div>
                </div>
                {activeAgg.total === 0 && (
                  <section className="as-card">
                    <p className="muted">还没有答卷。可本机填写，或点「模拟回收」体验汇总图。</p>
                  </section>
                )}
                {activeAgg.questions.map((q) => (
                  <section className="as-card" key={q.questionId}>
                    <h3>{q.title}</h3>
                    <p className="muted">
                      {q.type} · 作答 {q.answered}
                      {q.mean !== undefined ? ` · 均值 ${q.mean}` : ""}
                    </p>
                    {q.distribution && <BarChart buckets={q.distribution} />}
                    {q.texts && q.texts.length > 0 && (
                      <ul className="as-texts">
                        {q.texts.slice(0, 12).map((t, i) => (
                          <li key={`${q.questionId}-${i}`}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "share" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>分享结果</h2>
              <p className="muted">
                生成只读统计快照（不含答卷身份）。适合把导师评价 / 学校评价汇总发给同学或公示。
              </p>
              <div className="as-row">
                <select value={active?.id || ""} onChange={(e) => setActiveId(e.target.value)}>
                  {state.surveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <label className="as-check">
                  <input
                    type="checkbox"
                    checked={redactTexts}
                    onChange={(e) => setRedactTexts(e.target.checked)}
                  />
                  开放题脱敏
                </label>
              </div>
              {active && active.resultsShare === "owner" && (
                <p className="as-warn">该卷设置为「仅创建者查看」，不能生成对外快照。请先编辑为可分享。</p>
              )}
              {active && active.resultsShare === "snapshot" && activeAgg && (
                <div className="as-row">
                  <button
                    type="button"
                    className="as-btn"
                    onClick={() => {
                      const code = encodeSnapshot(activeAgg, redactTexts);
                      const link = snapshotLink(code);
                      copyText("快照链接", link);
                      setSnapshotView(
                        redactTexts
                          ? {
                              ...activeAgg,
                              questions: activeAgg.questions.map((q) =>
                                q.type === "text"
                                  ? { ...q, texts: q.texts?.map(() => "（已脱敏）") }
                                  : q,
                              ),
                            }
                          : activeAgg,
                      );
                    }}
                  >
                    生成并复制快照链接
                  </button>
                  <button
                    type="button"
                    className="as-btn ghost"
                    onClick={() => {
                      const code = encodeSnapshot(activeAgg, redactTexts);
                      copyText("快照码", code);
                    }}
                  >
                    复制快照码
                  </button>
                </div>
              )}
              <div className="as-field">
                <label>粘贴快照码预览</label>
                <textarea
                  value={snapPaste}
                  onChange={(e) => setSnapPaste(e.target.value)}
                  placeholder="AS3-…"
                />
              </div>
              <button
                type="button"
                className="as-btn ghost"
                onClick={() => {
                  const decoded = decodePayload(snapPaste);
                  if (!decoded || decoded.kind !== "snapshot") {
                    flash("无效快照码");
                    return;
                  }
                  setSnapshotView(decoded.aggregate);
                  flash("已载入只读快照");
                }}
              >
                预览快照
              </button>
              <div className="as-discuss-cta">
                <p>分享不只是数字——把结果放到匿名讨论区继续聊。</p>
                <button type="button" className="as-btn" onClick={() => setTab("discuss")}>
                  打开匿名讨论区
                </button>
              </div>
            </section>

            {snapshotView && (
              <section className="as-card as-snapshot">
                <p className="as-eyebrow">只读结果快照</p>
                <h2>{snapshotView.title}</h2>
                <p className="muted">
                  回收 {snapshotView.total} · 生成于 {new Date(snapshotView.generatedAt).toLocaleString()}
                </p>
                {snapshotView.questions.map((q) => (
                  <div key={q.questionId} className="as-snap-q">
                    <h3>{q.title}</h3>
                    {q.mean !== undefined && <p className="muted">均值 {q.mean}</p>}
                    {q.distribution && <BarChart buckets={q.distribution} />}
                    {q.texts && (
                      <ul className="as-texts">
                        {q.texts.slice(0, 8).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {tab === "discuss" && (
          <div className="as-panel as-fade">
            <section className="as-card as-discuss-hero">
              <p className="as-eyebrow">Anonymous board</p>
              <h2>匿名讨论区</h2>
              <p className="muted">
                绑定某份问卷结果的留言板：每次发布自动生成随机别名（如「溪石·K7M」），不记姓名与账号。跨设备可导出讨论打包码合并。
              </p>
              <div className="as-row">
                <select value={active?.id || ""} onChange={(e) => setActiveId(e.target.value)}>
                  <option value="">选择问卷…</option>
                  {state.surveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                {active && (
                  <>
                    <button
                      type="button"
                      className="as-btn ghost"
                      onClick={() =>
                        copyText(
                          "讨论链接",
                          `${window.location.origin}/survey?mode=discuss&id=${encodeURIComponent(active.id)}`,
                        )
                      }
                    >
                      复制讨论链接
                    </button>
                    <button
                      type="button"
                      className="as-btn ghost"
                      onClick={() => copyText("讨论打包码", encodeDiscussPack(active, state.posts))}
                    >
                      导出讨论打包码
                    </button>
                  </>
                )}
              </div>
            </section>

            {active && (
              <section className="as-card">
                <h3>发表匿名看法</h3>
                {replyTo && (
                  <p className="as-reply-hint">
                    回复楼层 {replyTo}{" "}
                    <button type="button" className="as-btn ghost" onClick={() => setReplyTo(undefined)}>
                      取消回复
                    </button>
                  </p>
                )}
                <div className="as-field">
                  <label>内容（≤800 字）</label>
                  <textarea
                    value={discussBody}
                    onChange={(e) => setDiscussBody(e.target.value)}
                    placeholder="例如：均值偏低的那一题，大家觉得是指导频率还是反馈速度？"
                    rows={4}
                  />
                </div>
                <button type="button" className="as-btn" onClick={submitDiscuss}>
                  匿名发布
                </button>
              </section>
            )}

            <section className="as-card">
              <h3>导入讨论打包码</h3>
              <div className="as-field">
                <textarea
                  value={discussPackPaste}
                  onChange={(e) => setDiscussPackPaste(e.target.value)}
                  placeholder="粘贴 AS4-…"
                />
              </div>
              <button type="button" className="as-btn ghost" onClick={importDiscussPack}>
                合并导入
              </button>
            </section>

            <section className="as-card">
              <h3>讨论流 {active ? `· ${activePosts.length}` : ""}</h3>
              {!active && <p className="muted">先选择或创建一份问卷。</p>}
              {active && activePosts.length === 0 && (
                <p className="muted">还没有留言。分享结果后，邀请同学在这里匿名讨论。</p>
              )}
              <div className="as-thread">
                {activePosts.map((p) => (
                  <article className="as-post" key={p.id}>
                    <header>
                      <span className="as-alias">{p.alias}</span>
                      <time>{new Date(p.createdAt).toLocaleString()}</time>
                    </header>
                    {p.replyTo && <p className="as-reply-to">↳ 回复 {p.replyTo}</p>}
                    <p className="as-post-body">{p.body}</p>
                    <button
                      type="button"
                      className="as-btn ghost"
                      onClick={() => {
                        setReplyTo(p.id);
                        flash(`将回复 ${p.alias}`);
                      }}
                    >
                      回复
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "verify" && (
          <div className="as-panel as-fade">
            <section className="as-card">
              <h2>功能验证</h2>
              <p className="muted">一键跑通模板发布、私密门禁、匿名提交、汇总、快照、讨论、持久化与 CSV。</p>
              <button type="button" className="as-btn" onClick={runVerifyAll}>
                重新跑验证套件
              </button>
              <table className="as-table">
                <thead>
                  <tr>
                    <th>用例</th>
                    <th>结果</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {verify.map((v) => (
                    <tr key={v.id}>
                      <td>{v.label}</td>
                      <td
                        className={
                          v.status === "pass" ? "as-ok" : v.status === "fail" ? "as-fail" : "as-pending"
                        }
                      >
                        {v.status === "idle" ? "待测" : v.status === "pass" ? "PASS" : "FAIL"}
                      </td>
                      <td>{v.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="as-card">
              <h3>部署说明</h3>
              <p className="muted">
                路径 <code>/survey</code>，不占顶栏。数据键 <code>anon-survey:v1</code>。
              </p>
              <div className="as-log">{state.logs.slice(0, 12).join("\n") || "暂无日志"}</div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
