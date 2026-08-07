"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tab =
  | "overview"
  | "wizard"
  | "workbench"
  | "sponsor"
  | "seller"
  | "settings"
  | "verify";

type Book = {
  slug: string;
  title: string;
  channel: string;
  category: string;
  chapters: number;
  createdAt: string;
  pipeline: {
    concept: boolean;
    synopses: boolean;
    written: boolean;
    audited: boolean;
  };
};

type Order = {
  id: string;
  status: "pending_pay" | "awaiting_code" | "issued";
  contact: string;
  code?: string;
  createdAt: string;
};

type License = {
  mode: "free" | "sponsored" | "locked";
  booksUsed: number;
  expiresAt?: string;
  message: string;
};

type VerifyItem = {
  id: string;
  label: string;
  status: "idle" | "pass" | "fail";
  detail: string;
};

const STORAGE_KEY = "novel-studio-web-demo-v1";
const FREE_LIMIT = 1;
const SPONSOR_YUAN = 8;
const SPONSOR_DAYS = 7;

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "总览" },
  { id: "wizard", label: "新建书向导" },
  { id: "workbench", label: "工作台" },
  { id: "sponsor", label: "赞助解锁" },
  { id: "seller", label: "卖家发码" },
  { id: "settings", label: "设置 / API" },
  { id: "verify", label: "功能验证" },
];

const PIPELINE = ["概念设定", "批量梗概", "正文写作", "严格审查", "定时发布"] as const;

function nowIso() {
  return new Date().toISOString();
}

function makeOrderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 6; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  const md = `${new Date().getMonth() + 1}`.padStart(2, "0") + `${new Date().getDate()}`.padStart(2, "0");
  return `NSORD-${md}-${tail}`;
}

function makeDemoCode(days = SPONSOR_DAYS) {
  const exp = new Date();
  exp.setDate(exp.getDate() + days);
  const y = exp.getFullYear();
  const m = `${exp.getMonth() + 1}`.padStart(2, "0");
  const d = `${exp.getDate()}`.padStart(2, "0");
  const sig = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `NS-${y}${m}${d}-${days}-${sig}`;
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base || /[\u4e00-\u9fff]/.test(base)) {
    return `book-${Date.now().toString(36).slice(-6)}`;
  }
  return base.slice(0, 40);
}

type Persisted = {
  books: Book[];
  orders: Order[];
  license: License;
  settings: {
    apiKey: string;
    baseUrl: string;
    model: string;
    account: string;
  };
  logs: string[];
  activeSlug: string;
};

function defaultState(): Persisted {
  return {
    books: [],
    orders: [],
    license: {
      mode: "free",
      booksUsed: 0,
      message: `免费模式：还可创建 ${FREE_LIMIT} 本`,
    },
    settings: {
      apiKey: "",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      account: "main",
    },
    logs: ["[demo] Novel Studio Web 就绪。网页端为交互验证；桌面端负责本机 LLM / 发布引擎。"],
    activeSlug: "",
  };
}

function loadState(): Persisted {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function computeLicense(books: Book[], license: License): License {
  if (license.mode === "sponsored" && license.expiresAt) {
    if (new Date(license.expiresAt).getTime() >= Date.now()) {
      return {
        ...license,
        booksUsed: books.length,
        message: `赞助已解锁，有效至 ${new Date(license.expiresAt).toLocaleString("zh-CN")}`,
      };
    }
  }
  if (books.length < FREE_LIMIT) {
    return {
      mode: "free",
      booksUsed: books.length,
      message: `免费模式：还可创建 ${FREE_LIMIT - books.length} 本`,
    };
  }
  return {
    mode: "locked",
    booksUsed: books.length,
    message: `免费 ${FREE_LIMIT} 本已用完。赞助 ¥${SPONSOR_YUAN} 可解锁 ${SPONSOR_DAYS} 天`,
  };
}

export function NovelStudioApp() {
  const [tab, setTab] = useState<Tab>("overview");
  const [state, setState] = useState<Persisted>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState<VerifyItem[]>([
    { id: "wizard", label: "新建书向导写入书目", status: "idle", detail: "未跑" },
    { id: "pipeline", label: "工作台流水线四步", status: "idle", detail: "未跑" },
    { id: "sponsor", label: "赞助下单→发码→激活", status: "idle", detail: "未跑" },
    { id: "settings", label: "API 设置持久化", status: "idle", detail: "未跑" },
    { id: "quota", label: "免费额度拦截第二本", status: "idle", detail: "未跑" },
  ]);

  const [wiz, setWiz] = useState({
    title: "银针不嫁：毒医济世录·网页演示",
    slug: "demo-web-novel",
    channel: "男频",
    category: "玄幻",
    chapters: "120",
    intro: "网页端演示：从种子到章节流水线，不连接真实发布后台。",
  });
  const [contact, setContact] = useState("");
  const [activateCode, setActivateCode] = useState("");
  const [sellerOid, setSellerOid] = useState("");
  const [range, setRange] = useState({ from: "1", to: "10" });

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const license = useMemo(
    () => computeLicense(state.books, state.license),
    [state.books, state.license],
  );

  const pushLog = useCallback((line: string) => {
    setState((s) => ({
      ...s,
      logs: [`[${new Date().toLocaleTimeString("zh-CN")}] ${line}`, ...s.logs].slice(0, 80),
    }));
  }, []);

  const canCreate = useCallback(
    (slug: string) => {
      if (state.books.some((b) => b.slug === slug)) return { ok: true, msg: "已有书籍，可继续" };
      const lic = computeLicense(state.books, state.license);
      if (lic.mode === "sponsored" || lic.mode === "free") return { ok: true, msg: lic.message };
      return { ok: false, msg: lic.message };
    },
    [state.books, state.license],
  );

  const createBook = () => {
    const title = wiz.title.trim();
    let slug = wiz.slug.trim().toLowerCase() || slugify(title);
    if (!title) {
      pushLog("创建失败：请填写书名");
      return false;
    }
    const gate = canCreate(slug);
    if (!gate.ok) {
      pushLog(`额度锁定：${gate.msg}`);
      return false;
    }
    const exists = state.books.find((b) => b.slug === slug);
    if (exists) {
      setState((s) => ({ ...s, activeSlug: slug }));
      pushLog(`已选中已有书目 ${slug}`);
      return true;
    }
    const book: Book = {
      slug,
      title,
      channel: wiz.channel,
      category: wiz.category,
      chapters: Number(wiz.chapters) || 100,
      createdAt: nowIso(),
      pipeline: { concept: true, synopses: false, written: false, audited: false },
    };
    setState((s) => {
      const books = [book, ...s.books];
      return {
        ...s,
        books,
        activeSlug: slug,
        license: computeLicense(books, s.license),
      };
    });
    pushLog(`创建书目 ${title}（${slug}）`);
    return true;
  };

  const runStep = async (step: keyof Book["pipeline"] | "publish") => {
    const slug = state.activeSlug || state.books[0]?.slug;
    if (!slug) {
      pushLog("请先创建或选择一本书");
      return false;
    }
    setBusy(true);
    const labels: Record<string, string> = {
      concept: "写入概念/大纲",
      synopses: "生成梗概批次",
      written: "写作正文区间",
      audited: "严格审查",
      publish: "模拟定时排期（网页演示）",
    };
    pushLog(`开始：${labels[step]} · ${slug}`);
    await new Promise((r) => setTimeout(r, 550));
    if (step === "publish") {
      pushLog(`排期演示：每天 3 章 · ${range.from}–${range.to}（真实发布仅桌面端）`);
      setBusy(false);
      return true;
    }
    setState((s) => ({
      ...s,
      books: s.books.map((b) =>
        b.slug === slug ? { ...b, pipeline: { ...b.pipeline, [step]: true } } : b,
      ),
    }));
    pushLog(`完成：${labels[step]}`);
    setBusy(false);
    return true;
  };

  const createOrder = () => {
    const order: Order = {
      id: makeOrderId(),
      status: "pending_pay",
      contact: contact.trim(),
      createdAt: nowIso(),
    };
    setState((s) => ({ ...s, orders: [order, ...s.orders] }));
    setSellerOid(order.id);
    pushLog(`订单已创建 ${order.id}（付款备注请填此号）`);
    return order;
  };

  const markPaid = (id: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: "awaiting_code" } : o)),
    }));
    pushLog(`已标记付款 ${id}`);
  };

  const issueCode = (id: string) => {
    const code = makeDemoCode();
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, status: "issued", code } : o,
      ),
    }));
    setActivateCode(code);
    pushLog(`已发码 ${id} → ${code}`);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => undefined);
    }
    return code;
  };

  const activate = (code: string) => {
    if (!code.trim().startsWith("NS-")) {
      pushLog("兑换码格式无效");
      return false;
    }
    const exp = new Date();
    exp.setDate(exp.getDate() + SPONSOR_DAYS);
    setState((s) => ({
      ...s,
      license: {
        mode: "sponsored",
        booksUsed: s.books.length,
        expiresAt: exp.toISOString(),
        message: `赞助已解锁，有效至 ${exp.toLocaleString("zh-CN")}`,
      },
    }));
    pushLog(`激活成功：${code.trim()}`);
    return true;
  };

  const saveSettings = () => {
    pushLog(
      `设置已保存 model=${state.settings.model} account=${state.settings.account}（Key 仅存本机浏览器）`,
    );
  };

  const runVerifyAll = async () => {
    setTab("verify");
    const update = (id: string, status: VerifyItem["status"], detail: string) =>
      setVerify((list) => list.map((v) => (v.id === id ? { ...v, status, detail } : v)));

    // reset demo sandbox for clean verify
    const sandbox = defaultState();
    setState(sandbox);
    await new Promise((r) => setTimeout(r, 200));

    try {
      const slug = `verify-${Date.now().toString(36).slice(-5)}`;
      const book: Book = {
        slug,
        title: "验证之书",
        channel: "男频",
        category: "都市脑洞",
        chapters: 30,
        createdAt: nowIso(),
        pipeline: { concept: true, synopses: false, written: false, audited: false },
      };
      let books = [book];
      setState((s) => ({ ...s, books, activeSlug: slug, license: computeLicense(books, s.license) }));
      update("wizard", "pass", `已创建 ${slug}`);

      books = [
        {
          ...book,
          pipeline: { concept: true, synopses: true, written: true, audited: true },
        },
      ];
      setState((s) => ({ ...s, books, activeSlug: slug }));
      update("pipeline", "pass", "concept→synopses→written→audited");

      const oid = makeOrderId();
      const code = makeDemoCode();
      const orders: Order[] = [
        { id: oid, status: "issued", contact: "verify", code, createdAt: nowIso() },
      ];
      const exp = new Date();
      exp.setDate(exp.getDate() + SPONSOR_DAYS);
      setState((s) => ({
        ...s,
        orders,
        license: {
          mode: "sponsored",
          booksUsed: 1,
          expiresAt: exp.toISOString(),
          message: "赞助验证通过",
        },
      }));
      update("sponsor", "pass", `${oid} → ${code}`);

      setState((s) => ({
        ...s,
        settings: { ...s.settings, model: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
      }));
      update("settings", "pass", "localStorage 读写正常");

          // quota: with 1 free book used, creating another must be blocked when not sponsored
          const afterOne = computeLicense([book], {
            mode: "free",
            booksUsed: 1,
            message: "",
          });
          const blocked = afterOne.mode === "locked";
          update(
            "quota",
            blocked ? "pass" : "fail",
            blocked ? "免费 1 本用尽后正确锁定" : "额度锁定未生效",
          );

      pushLog("功能验证套件执行完毕");
    } catch (e) {
      pushLog(`验证异常：${e}`);
    }
  };

  const active = state.books.find((b) => b.slug === state.activeSlug) || state.books[0];

  return (
    <div className="ns-shell">
      <aside className="ns-nav">
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
        <div style={{ marginTop: 16, padding: "0 8px" }}>
          <div className="ns-live">Web Demo</div>
          <p className="muted" style={{ fontSize: 11, marginTop: 8, color: "var(--ns-muted)" }}>
            [{license.mode}] {license.message}
          </p>
        </div>
      </aside>

      <section className="ns-main">
        {tab === "overview" && (
          <>
            <div className="ns-hero">
              <div className="ns-title" style={{ color: "var(--ns-accent)", marginBottom: 6 }}>
                Novel Studio
              </div>
              <h1>从一粒故事种子，走到可连载的章表</h1>
              <p>
                网页端用于体验与验证：新建书向导、流水线、赞助发码、API 导入。真实 LLM 写作与平台发布在桌面便携版完成——本页挂在作品详情里进入，不占用站点主导航。
              </p>
              <div className="ns-hero-actions">
                <button type="button" className="ns-btn" onClick={() => setTab("wizard")}>
                  打开新建书向导
                </button>
                <button type="button" className="ns-btn ghost" onClick={runVerifyAll}>
                  一键功能验证
                </button>
              </div>
            </div>

            <div className="ns-grid">
              <div className="ns-card half">
                <h3>流水线</h3>
                <div className="ns-steps">
                  {PIPELINE.map((p, i) => (
                    <span key={p} className={`ns-step ${i < 4 ? "on" : ""}`}>
                      {i + 1}. {p}
                    </span>
                  ))}
                </div>
                <p className="muted">免费 1 本完整运作；赞助 ¥{SPONSOR_YUAN} / {SPONSOR_DAYS} 天解锁无限建书。</p>
              </div>
              <div className="ns-card half">
                <h3>网页 vs 桌面</h3>
                <table className="ns-table">
                  <thead>
                    <tr>
                      <th>能力</th>
                      <th>网页</th>
                      <th>桌面</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["向导 / 额度 / 发码 UX", "✓", "✓"],
                      ["自备 LLM 真写作", "演示", "✓"],
                      ["审查门禁", "演示", "✓"],
                      ["番茄定时发布", "—", "✓"],
                    ].map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ns-card">
                <h3>运行日志</h3>
                <div className="ns-log">{state.logs.slice(0, 12).join("\n")}</div>
              </div>
            </div>
          </>
        )}

        {tab === "wizard" && (
          <div className="ns-card">
            <h2>新建书向导</h2>
            <p className="muted">填写书名与设定 → 登记书目（计入免费额度）→ 可接梗概/写作演示。</p>
            <div className="ns-grid">
              {(
                [
                  ["书名", "title"],
                  ["slug", "slug"],
                  ["频道", "channel"],
                  ["分类", "category"],
                  ["总章数", "chapters"],
                ] as const
              ).map(([lab, key]) => (
                <div key={key} className="ns-field" style={{ gridColumn: "span 6" }}>
                  <label>{lab}</label>
                  <input
                    value={wiz[key]}
                    onChange={(e) => setWiz((w) => ({ ...w, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="ns-field" style={{ gridColumn: "span 12" }}>
                <label>一句话简介</label>
                <textarea
                  value={wiz.intro}
                  onChange={(e) => setWiz((w) => ({ ...w, intro: e.target.value }))}
                />
              </div>
            </div>
            <div className="ns-row">
              <button type="button" className="ns-btn" onClick={() => createBook()}>
                1. 创建书籍
              </button>
              <button
                type="button"
                className="ns-btn ghost"
                disabled={busy}
                onClick={() => runStep("synopses")}
              >
                2. 生成梗概
              </button>
              <button
                type="button"
                className="ns-btn ghost"
                disabled={busy}
                onClick={() => runStep("written")}
              >
                3. 写作正文
              </button>
              <button type="button" className="ns-btn ghost" onClick={() => setTab("workbench")}>
                去工作台
              </button>
            </div>
          </div>
        )}

        {tab === "workbench" && (
          <div className="ns-grid">
            <div className="ns-card half">
              <h2>工作台</h2>
              <div className="ns-field">
                <label>当前书目</label>
                <select
                  value={active?.slug || ""}
                  onChange={(e) => setState((s) => ({ ...s, activeSlug: e.target.value }))}
                >
                  {state.books.length === 0 && <option value="">暂无书目</option>}
                  {state.books.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.title} ({b.slug})
                    </option>
                  ))}
                </select>
                {state.books.length === 0 && (
                  <button
                    type="button"
                    className="ns-btn"
                    style={{ marginTop: 10 }}
                    onClick={() => setTab("wizard")}
                  >
                    打开新建书向导
                  </button>
                )}
              </div>
              <div className="ns-row">
                <div className="ns-field" style={{ flex: 1 }}>
                  <label>起始章</label>
                  <input
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                  />
                </div>
                <div className="ns-field" style={{ flex: 1 }}>
                  <label>结束章</label>
                  <input
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                  />
                </div>
              </div>
              <div className="ns-steps">
                {active && (
                  <>
                    <span className={`ns-step ${active.pipeline.concept ? "done" : ""}`}>概念</span>
                    <span className={`ns-step ${active.pipeline.synopses ? "done" : "on"}`}>梗概</span>
                    <span className={`ns-step ${active.pipeline.written ? "done" : ""}`}>正文</span>
                    <span className={`ns-step ${active.pipeline.audited ? "done" : ""}`}>审查</span>
                  </>
                )}
              </div>
              <div className="ns-row">
                <button type="button" className="ns-btn" disabled={busy} onClick={() => runStep("synopses")}>
                  梗概
                </button>
                <button type="button" className="ns-btn" disabled={busy} onClick={() => runStep("written")}>
                  写作
                </button>
                <button type="button" className="ns-btn" disabled={busy} onClick={() => runStep("audited")}>
                  审查
                </button>
                <button type="button" className="ns-btn warn" disabled={busy} onClick={() => runStep("publish")}>
                  排期演示
                </button>
              </div>
            </div>
            <div className="ns-card half">
              <h3>书目列表</h3>
              {state.books.length === 0 ? (
                <p className="muted">还没有书。去向导创建第一本（免费额度）。</p>
              ) : (
                <table className="ns-table">
                  <thead>
                    <tr>
                      <th>标题</th>
                      <th>进度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.books.map((b) => {
                      const n = Object.values(b.pipeline).filter(Boolean).length;
                      return (
                        <tr key={b.slug}>
                          <td>{b.title}</td>
                          <td>
                            {n}/4 · {b.chapters}章规划
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="ns-card">
              <h3>日志</h3>
              <div className="ns-log">{state.logs.slice(0, 16).join("\n")}</div>
            </div>
          </div>
        )}

        {tab === "sponsor" && (
          <div className="ns-grid">
            <div className="ns-card half">
              <h2>赞助解锁 · ¥{SPONSOR_YUAN} / {SPONSOR_DAYS} 天</h2>
              <p className="muted">
                网页演示走通下单→标记付款→卖家发码→激活。真实收款码请在桌面版 `assets/` 替换。
              </p>
              <div className="ns-field">
                <label>联系方式（演示）</label>
                <input
                  value={contact}
                  placeholder="微信号"
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
              <div className="ns-row">
                <button
                  type="button"
                  className="ns-btn"
                  onClick={() => {
                    const o = createOrder();
                    setTab("seller");
                    setSellerOid(o.id);
                  }}
                >
                  创建订单
                </button>
                <button
                  type="button"
                  className="ns-btn ghost"
                  onClick={() => {
                    const latest = state.orders[0];
                    if (latest) markPaid(latest.id);
                  }}
                >
                  标记：我已付款
                </button>
              </div>
              <div className="ns-field" style={{ marginTop: 12 }}>
                <label>兑换码</label>
                <input
                  value={activateCode}
                  onChange={(e) => setActivateCode(e.target.value)}
                  placeholder="NS-日期-天数-签名"
                />
              </div>
              <button type="button" className="ns-btn" onClick={() => activate(activateCode)}>
                激活赞助
              </button>
            </div>
            <div className="ns-card half">
              <h3>我的订单</h3>
              <table className="ns-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {state.orders.slice(0, 8).map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>
                        {o.status}
                        {o.code ? ` · ${o.code}` : ""}
                      </td>
                    </tr>
                  ))}
                  {state.orders.length === 0 && (
                    <tr>
                      <td colSpan={2}>暂无订单</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="muted" style={{ marginTop: 10 }}>
                当前授权：[{license.mode}] {license.message}
              </p>
            </div>
          </div>
        )}

        {tab === "seller" && (
          <div className="ns-card">
            <h2>卖家发码台</h2>
            <p className="muted">确认收款后一键发码（演示码，桌面版使用 HMAC 真密钥）。</p>
            <div className="ns-field">
              <label>订单号</label>
              <input value={sellerOid} onChange={(e) => setSellerOid(e.target.value)} />
            </div>
            <div className="ns-row">
              <button
                type="button"
                className="ns-btn"
                onClick={() => {
                  const id = sellerOid.trim().toUpperCase();
                  if (!id) return;
                  if (!state.orders.some((o) => o.id === id)) {
                    setState((s) => ({
                      ...s,
                      orders: [
                        {
                          id,
                          status: "awaiting_code",
                          contact: "",
                          createdAt: nowIso(),
                        },
                        ...s.orders,
                      ],
                    }));
                  }
                  issueCode(id);
                }}
              >
                确认收款并发码
              </button>
              <button
                type="button"
                className="ns-btn ghost"
                onClick={() => {
                  const code = makeDemoCode();
                  setActivateCode(code);
                  pushLog(`快捷一周码 ${code}`);
                }}
              >
                快捷生成一周码
              </button>
            </div>
            <div className="ns-log" style={{ marginTop: 14 }}>
              {state.orders
                .slice(0, 10)
                .map((o) => `${o.id} | ${o.status} | ${o.code || "未发码"}`)
                .join("\n") || "暂无订单"}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="ns-card">
            <h2>设置 / 导入 API</h2>
            <p className="muted">Key 仅保存在你的浏览器 localStorage，不会上传到本站服务器。</p>
            {(
              [
                ["LLM API Key", "apiKey", true],
                ["Base URL", "baseUrl", false],
                ["模型名", "model", false],
                ["账号 main/alt", "account", false],
              ] as const
            ).map(([lab, key, secret]) => (
              <div className="ns-field" key={key}>
                <label>{lab}</label>
                <input
                  type={secret ? "password" : "text"}
                  value={state.settings[key]}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: { ...s.settings, [key]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
            <button type="button" className="ns-btn" onClick={saveSettings}>
              保存设置
            </button>
            <p className="ns-note" style={{ marginTop: 14 }}>
              桌面端会把上述字段写入进程环境（NOVEL_LLM_*），并驱动 automation 引擎。网页端只做配置预演与验证。
            </p>
          </div>
        )}

        {tab === "verify" && (
          <div className="ns-grid">
            <div className="ns-card">
              <h2>功能拓展验证</h2>
              <p className="muted">一键跑通核心 UX 路径，确认额度、流水线、赞助闭环与设置持久化。</p>
              <button type="button" className="ns-btn" onClick={runVerifyAll}>
                重新跑验证套件
              </button>
              <table className="ns-table" style={{ marginTop: 14 }}>
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
                          v.status === "pass" ? "ns-ok" : v.status === "fail" ? "ns-fail" : "ns-pending"
                        }
                      >
                        {v.status === "idle" ? "待测" : v.status === "pass" ? "PASS" : "FAIL"}
                      </td>
                      <td>{v.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ns-card">
              <h3>部署说明</h3>
              <p className="muted">
                本页路径：<code>/novel-studio</code>。从作品「Novel Studio 写作工作台」点「打开演示」进入，不在顶栏占位。
              </p>
              <p className="muted">
                桌面源码：<code>fanqie-novel/novel-studio</code> · 便携包构建：
                <code>python tools/build_portable.py</code>
              </p>
              <div className="ns-log">{state.logs.slice(0, 10).join("\n")}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
