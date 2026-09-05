"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HydroDashboard } from "@/components/hydro/HydroDashboard";
import { HydroGuideBar } from "@/components/hydro/HydroGuideBar";
import {
  GUIDE_INTRO_120,
  GUIDE_LINKS,
  GUIDE_STEPS,
  GUIDE_TOTAL,
  guideStepHref,
  isGuideMode,
  parseGuideStep,
  type GuideStepId,
} from "@/lib/hydro-guide";
import { trackCta } from "@/lib/analytics";

/** 一级：总览 → 态势 | 作业台 | 空间 | 模型 | 文档；作业台下再分室内/户外 */
type Tab = "hub" | "info" | "studio" | "field" | "map" | "model" | "doc";

type Kind = "态势" | "作业" | "空间" | "机理" | "文档";

function resolveTab(raw: string | null): Tab {
  if (raw === "studio" || raw === "bench" || raw === "workbench" || raw === "ops") return "studio";
  if (raw === "field") return "field";
  if (raw === "info" || raw === "situ" || raw === "态势") return "info";
  if (raw === "map" || raw === "space" || raw === "spatial" || raw === "watershed") return "map";
  if (raw === "model" || raw === "xaj" || raw === "mech") return "model";
  if (raw === "doc" || raw === "report" || raw === "wbr" || raw === "balance") return "doc";
  return "hub";
}

function primaryOf(tab: Tab): "hub" | "info" | "work" | "map" | "model" | "doc" {
  if (tab === "studio" || tab === "field") return "work";
  if (tab === "hub" || tab === "info" || tab === "map" || tab === "model" || tab === "doc") return tab;
  return "hub";
}

const PRIMARY_NAV: {
  id: "hub" | "info" | "work" | "map" | "model" | "doc";
  label: string;
  kind?: Kind;
  tab: Tab;
}[] = [
  { id: "hub", label: "总览", tab: "hub" },
  { id: "info", label: "态势", kind: "态势", tab: "info" },
  { id: "work", label: "作业台", kind: "作业", tab: "studio" },
  { id: "map", label: "空间", kind: "空间", tab: "map" },
  { id: "model", label: "模型", kind: "机理", tab: "model" },
  { id: "doc", label: "文档", kind: "文档", tab: "doc" },
];

const EMBED_PANES: Partial<Record<Tab, { title: string; src: string }>> = {
  studio: { title: "室内作业台", src: "/hydrobench/studio/index.html?embed=1" },
  field: { title: "户外应急台", src: "/hydrobench/field/index.html?embed=1" },
  map: { title: "流域一张图", src: "/watershed-map?embed=1" },
  model: { title: "产汇流机理对照", src: "/xaj-bench?embed=1" },
  doc: { title: "水平衡论证草稿", src: "/water-balance-report?embed=1" },
};

type HubCard = {
  id: GuideStepId | "work-field";
  group: "看站网与作业" | "落空间" | "算预报与出文档";
  kind: Kind;
  title: string;
  role: string;
  href: string;
  guideId?: GuideStepId;
  status: "已上线";
};

const HUB_GROUPS: { key: HubCard["group"]; cards: HubCard[] }[] = [
  {
    key: "看站网与作业",
    cards: [
      {
        id: 3,
        group: "看站网与作业",
        kind: "态势",
        title: "站网态势",
        role: "一眼看多站流量、水位、降水是否异常，适合值班与汇报开场。",
        href: "/hydrobench?tab=info",
        guideId: 3,
        status: "已上线",
      },
      {
        id: 1,
        group: "看站网与作业",
        kind: "作业",
        title: "室内作业台",
        role: "把 DAT / CSV / 水位与断面整编成图，坐在办公室也能复现测次。",
        href: "/hydrobench?tab=studio",
        guideId: 1,
        status: "已上线",
      },
      {
        id: "work-field",
        group: "看站网与作业",
        kind: "作业",
        title: "户外应急台",
        role: "断网也能记测次、速算与清单，回城再导出。",
        href: "/hydrobench?tab=field",
        status: "已上线",
      },
    ],
  },
  {
    key: "落空间",
    cards: [
      {
        id: 2,
        group: "落空间",
        kind: "空间",
        title: "流域一张图",
        role: "水系、子流域、测站叠在同一张底图上，点一下就知道空间关系。",
        href: "/hydrobench?tab=map",
        guideId: 2,
        status: "已上线",
      },
    ],
  },
  {
    key: "算预报与出文档",
    cards: [
      {
        id: 4,
        group: "算预报与出文档",
        kind: "机理",
        title: "产汇流机理对照",
        role: "新安江产汇流与数据驱动基线同口径比 NSE，讲得清「为什么这么报」。",
        href: "/hydrobench?tab=model",
        guideId: 4,
        status: "已上线",
      },
      {
        id: 5,
        group: "算预报与出文档",
        kind: "文档",
        title: "水平衡论证草稿",
        role: "填取用水结构 → 水平衡表 → 可导出论证报告，贴室内岗交付。",
        href: "/hydrobench?tab=doc",
        guideId: 5,
        status: "已上线",
      },
    ],
  },
];

export function HydroHub() {
  const search = useSearchParams();
  const reduceMotion = useReducedMotion();
  const initial = useMemo(() => resolveTab(search.get("tab")), [search]);
  const [tab, setTab] = useState<Tab>(initial);
  const [guideFocus, setGuideFocus] = useState<GuideStepId | 0>(0);
  const [copied, setCopied] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const tourDone = search.get("tour") === "done";
  const inGuide = isGuideMode(search);
  const guideStep = parseGuideStep(search.get("step"));

  useEffect(() => {
    setTab(initial);
  }, [initial]);

  useEffect(() => {
    if (guideStep) setGuideFocus(guideStep);
  }, [guideStep]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (tab === "hub") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  useEffect(() => {
    if (!guideFocus || !stripRef.current) return;
    const el = stripRef.current.querySelector(`[data-step="${guideFocus}"]`);
    el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [guideFocus, reduceMotion, tab]);

  useEffect(() => {
    if (tourDone) trackCta("guide-complete", "导览完成页");
  }, [tourDone]);

  const primary = primaryOf(tab);
  const embed = EMBED_PANES[tab];
  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: "easeOut" as const };

  function openHref(href: string) {
    if (href.startsWith("/hydrobench?") || href.startsWith("/hydrobench&")) {
      const u = new URL(href, window.location.origin);
      const next = resolveTab(u.searchParams.get("tab"));
      setTab(next);
      window.history.replaceState({}, "", u.pathname + u.search);
      return;
    }
    window.location.href = href;
  }

  function startGuide() {
    setGuideFocus(1);
    trackCta("guide-start", "开始导览");
    openHref(guideStepHref(1));
  }

  async function copyIntro() {
    try {
      await navigator.clipboard.writeText(GUIDE_INTRO_120);
      setCopied(true);
      trackCta("guide-copy-intro", "复制自我介绍");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const showDone = tourDone && tab === "hub";

  function selectPrimary(id: (typeof PRIMARY_NAV)[number]["id"]) {
    const item = PRIMARY_NAV.find((p) => p.id === id)!;
    setTab(item.tab);
    trackCta(`hydro-nav-${id}`, item.label);
  }

  return (
    <div className="hb-root hydro-skin">
      <header className="hb-top">
        <Link href="/" className="hb-back">
          ← 返回主站
        </Link>
        <div className="hb-brand">
          <span className="hb-mark" aria-hidden>
            水
          </span>
          <div>
            <div className="hb-title">智慧水利</div>
            <div className="hb-sub">总览 → 态势 · 作业台 · 空间 · 模型 · 文档</div>
          </div>
        </div>
        <nav className="hb-nav" aria-label="智慧水利信息架构">
          <div className="hb-tabs" role="tablist">
            {PRIMARY_NAV.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={primary === p.id}
                className={primary === p.id ? "active" : ""}
                onClick={() => selectPrimary(p.id)}
              >
                {p.label}
                {p.kind && <span className="hb-tab-kind">{p.kind}</span>}
              </button>
            ))}
          </div>
          {primary === "work" && (
            <div className="hb-subtabs" role="tablist" aria-label="作业台">
              <button
                type="button"
                role="tab"
                className={tab === "studio" ? "active" : ""}
                aria-selected={tab === "studio"}
                onClick={() => setTab("studio")}
              >
                室内整编
              </button>
              <button
                type="button"
                role="tab"
                className={tab === "field" ? "active" : ""}
                aria-selected={tab === "field"}
                onClick={() => setTab("field")}
              >
                户外应急
              </button>
            </div>
          )}
        </nav>
      </header>

      {(inGuide || (guideStep && tab !== "hub")) && <HydroGuideBar />}

      <AnimatePresence mode="wait">
        {tab === "hub" ? (
          <motion.div
            key="hub"
            className="hb-pane hb-pane-hub"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={fade}
          >
            <section className="hb-hub">
              {showDone ? (
                <div className="hb-guide-done">
                  <p className="hb-hub-eyebrow">Tour complete</p>
                  <h1>导览完成</h1>
                  <p>你已走完主链五步。复制下面自我介绍，或打开外链继续。</p>
                  <div className="hb-intro-box">
                    <p>{GUIDE_INTRO_120}</p>
                    <p className="hb-intro-count">{GUIDE_INTRO_120.length} / 120 字</p>
                    <button type="button" className="hb-open" onClick={copyIntro}>
                      {copied ? "已复制" : "复制自我介绍"}
                    </button>
                  </div>
                  <ul className="hb-guide-links">
                    {GUIDE_LINKS.map((l) => (
                      <li key={l.href}>
                        <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <Link href="/hydrobench" className="hb-open ghost">
                    回到总览
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hb-hub-intro">
                    <p className="hb-hub-eyebrow">Smart Water Hub</p>
                    <h1>智慧水利统一入口</h1>
                    <p>
                      按业务找工具，不靠记技术名：先看态势与作业，再落空间，最后对模型、出论证文档。也可一键「开始导览」。
                    </p>
                    <div className="hb-hub-actions">
                      <button type="button" className="hb-open" onClick={startGuide}>
                        开始导览（约 5 分钟）
                      </button>
                      <span className="hydro-badge-demo">演示</span>
                    </div>
                  </div>

                  <div className="hb-step-strip" ref={stripRef} aria-label="导览步骤">
                    {GUIDE_STEPS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        data-step={s.id}
                        className={`hb-step-chip ${guideFocus === s.id ? "on" : ""}`}
                        onClick={() => {
                          setGuideFocus(s.id);
                          openHref(guideStepHref(s.id));
                        }}
                      >
                        <span>
                          {s.id}/{GUIDE_TOTAL}
                        </span>
                        {s.title}
                      </button>
                    ))}
                  </div>

                  {HUB_GROUPS.map((g) => (
                    <div className="hb-group" key={g.key}>
                      <h2 className="hb-group-title">{g.key}</h2>
                      <div className="hb-group-grid">
                        {g.cards.map((item) => (
                          <article
                            key={String(item.id)}
                            className={`hb-chain-card hb-hub-card ${
                              item.guideId && guideFocus === item.guideId ? "focus" : ""
                            }`}
                            data-step={item.guideId || undefined}
                          >
                            <div className="hb-chain-meta">
                              <span className="hb-kind">{item.kind}</span>
                              <span className="hb-chain-status">{item.status}</span>
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.role}</p>
                            <button
                              type="button"
                              className="hb-open"
                              onClick={() => {
                                if (guideFocus && item.guideId) openHref(guideStepHref(item.guideId));
                                else openHref(item.href);
                              }}
                            >
                              打开
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </section>
          </motion.div>
        ) : tab === "info" ? (
          <motion.div
            key="info"
            className="hb-pane hb-pane-info"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={fade}
          >
            <div className="hydro-root">
              <Suspense fallback={<p className="hb-muted">加载水情态势…</p>}>
                <HydroDashboard />
              </Suspense>
            </div>
          </motion.div>
        ) : embed ? (
          <motion.div
            key={tab}
            className="hb-pane"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={fade}
          >
            <iframe className="hb-frame" title={embed.title} src={embed.src} allow="clipboard-write" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
