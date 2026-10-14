"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ATLAS,
  HALLS,
  HYDRO_CHAIN,
  STORIES,
  atlasStats,
  chainAnchor,
  relatedExhibits,
  type AtlasExhibit,
  type AtlasHall,
  type AtlasStory,
} from "@/data/atlas";
import { trackClick, trackCta, trackPageview } from "@/lib/analytics";
import { MoodVis } from "@/components/atlas/MoodVis";
import { OrbitStage } from "@/components/atlas/OrbitStage";
import { StarMap } from "@/components/atlas/StarMap";

type View = "orbit" | "stars" | "cabinet";

function viewFromSearch(raw: string | null): View | null {
  if (raw === "orbit" || raw === "stars" || raw === "cabinet") return raw;
  return null;
}

function metricWidth(value: number) {
  if (!Number.isFinite(value)) return 40;
  if (value <= 1) return Math.max(12, value * 100);
  if (value <= 10) return Math.min(100, 20 + value * 8);
  return Math.min(100, 30 + Math.log10(value + 1) * 28);
}

export function AtlasApp() {
  const search = useSearchParams();
  const [hall, setHall] = useState<AtlasHall | "all">("all");
  const [story, setStory] = useState<AtlasStory | "all">("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>(() => viewFromSearch(search.get("view")) ?? "orbit");
  const [selected, setSelected] = useState(search.get("slug") || ATLAS[0]?.slug || "");
  const [copied, setCopied] = useState(false);
  const urlDirty = useRef(Boolean(search.get("slug") || search.get("view")));

  useEffect(() => {
    trackPageview();
    if (viewFromSearch(search.get("view"))) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    if (reduced || narrow) setView("cabinet");
    // 仅首屏决定默认视角，避免选中展品时把星轨打回展柜
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ATLAS.filter((e) => {
      if (hall !== "all" && e.hall !== hall) return false;
      if (story !== "all" && e.story !== story) return false;
      if (!needle) return true;
      const blob = `${e.title} ${e.tagline} ${e.stack.join(" ")} ${e.highlights.join(" ")}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [hall, story, q]);

  const stats = useMemo(() => atlasStats(filtered), [filtered]);
  const current =
    filtered.find((e) => e.slug === selected) || filtered[0] || ATLAS[0];

  useEffect(() => {
    if (current && current.slug !== selected) setSelected(current.slug);
  }, [filtered, current, selected]);

  useEffect(() => {
    if (!urlDirty.current || !selected) return;
    const params = new URLSearchParams();
    params.set("slug", selected);
    params.set("view", view);
    const qs = `?${params.toString()}`;
    if (window.location.search !== qs) {
      window.history.replaceState(null, "", `/atlas${qs}`);
    }
  }, [selected, view]);

  const pick = (slug: string) => {
    urlDirty.current = true;
    setSelected(slug);
    trackClick("atlas-exhibit", slug);
  };

  const changeView = (next: View) => {
    urlDirty.current = true;
    setView(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const i = filtered.findIndex((x) => x.slug === current?.slug);
      if (e.key === "ArrowRight" && i >= 0) pick(filtered[(i + 1) % filtered.length].slug);
      if (e.key === "ArrowLeft" && i >= 0) pick(filtered[(i - 1 + filtered.length) % filtered.length].slug);
      if (e.key === "1") changeView("orbit");
      if (e.key === "2") changeView("stars");
      if (e.key === "3") changeView("cabinet");
      if (e.key === "Escape") {
        setHall("all");
        setStory("all");
        setQ("");
      }
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("atlas-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, current?.slug, view, selected]);

  return (
    <div className="atlas-root">
      <div className="atlas-shell">
        <header className="atlas-hero">
          <div>
            <p className="atlas-kicker">Atlas / 作品星图</p>
            <h1 className="text-balance">把站点项目摊开成可逛的展馆</h1>
            <p className="atlas-lead text-pretty">
              三维星轨、二维星图与展柜三种看法。点开任意展品：指标、路径、演示入口与汇报页都在右侧。主站二次元气质保留，水利展品仍用自己的水色。
            </p>
            <p className="atlas-lead text-pretty" style={{ marginTop: "0.55rem" }}>
              想看活塞、混沌、光电、水流与星空？去{" "}
              <a href="/viz-lab" style={{ color: "#ff9aab", textDecoration: "underline" }}>
                视效实验室
              </a>
              。
            </p>
          </div>
          <div className="atlas-stats" aria-label="展馆统计">
            <div>
              <b className="tabular">{stats.total}</b>
              <span>展品</span>
            </div>
            <div>
              <b className="tabular">{stats.live}</b>
              <span>演示</span>
            </div>
            <div>
              <b className="tabular">{stats.decks}</b>
              <span>汇报</span>
            </div>
            <div>
              <b className="tabular">{stats.stacks}</b>
              <span>标签</span>
            </div>
          </div>
        </header>

        <div className="atlas-toolbar">
          <div className="atlas-mode" role="group" aria-label="浏览方式">
            {(
              [
                ["orbit", "星轨 1"],
                ["stars", "星图 2"],
                ["cabinet", "展柜 3"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={view === id ? "is-on" : ""}
                aria-pressed={view === id}
                onClick={() => changeView(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {HALLS.map((h) => {
            const n = h.id === "all" ? ATLAS.length : ATLAS.filter((e) => e.hall === h.id).length;
            return (
              <button
                key={h.id}
                type="button"
                className={hall === h.id ? "atlas-chip is-on" : "atlas-chip"}
                aria-pressed={hall === h.id}
                onClick={() => setHall(h.id)}
              >
                {h.label}
                <span className="atlas-count tabular">{n}</span>
              </button>
            );
          })}
          <input
            id="atlas-search"
            className="atlas-search"
            value={q}
            placeholder="搜索标题 / 技术栈  ·  / 聚焦"
            aria-label="搜索展品"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="atlas-story" role="group" aria-label="主链叙事">
          {STORIES.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.hint}
              className={story === s.id ? "atlas-chip is-on" : "atlas-chip"}
              aria-pressed={story === s.id}
              onClick={() => setStory(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <ol className="atlas-chain" aria-label="水利主链">
          {HYDRO_CHAIN.map((step, i) => {
            const on = current?.story === step;
            return (
              <li key={step}>
                {i > 0 ? <span className="atlas-chain-arrow" aria-hidden>→</span> : null}
                <button
                  type="button"
                  className={on ? "is-on" : ""}
                  onClick={() => {
                    const node = chainAnchor(step);
                    setStory(step);
                    setHall("all");
                    if (node) pick(node.slug);
                  }}
                >
                  {step}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="atlas-stage">
          <div className="atlas-viewport">
            {filtered.length === 0 ? (
              <div className="atlas-empty" style={{ padding: "1.2rem" }}>
                <p>没有匹配的展品。</p>
                <button
                  type="button"
                  className="atlas-chip is-on"
                  onClick={() => {
                    setHall("all");
                    setStory("all");
                    setQ("");
                  }}
                >
                  清空筛选
                </button>
              </div>
            ) : view === "orbit" ? (
              <OrbitStage items={filtered} selected={current.slug} onSelect={pick} />
            ) : view === "stars" ? (
              <StarMap items={filtered} selected={current.slug} onSelect={pick} />
            ) : (
              <div className="atlas-cabinet">
                {filtered.map((e) => (
                  <button
                    key={e.slug}
                    type="button"
                    className={e.slug === current.slug ? "atlas-card is-on" : "atlas-card"}
                    aria-pressed={e.slug === current.slug}
                    style={{ borderColor: e.slug === current.slug ? e.color : undefined }}
                    onClick={() => pick(e.slug)}
                  >
                    <div className="emo">{e.emoji}</div>
                    <strong>{e.title}</strong>
                    <p>{e.tagline}</p>
                  </button>
                ))}
              </div>
            )}
            <p className="atlas-keys">← → 切换 · 1 星轨 · 2 星图 · 3 展柜 · Esc 重置</p>
            <ul className="sr-only">
              {filtered.map((e) => (
                <li key={e.slug}>
                  <button type="button" onClick={() => pick(e.slug)}>
                    {e.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {current ? (
            <Dock
              exhibit={current}
              copied={copied}
              onPick={pick}
              onCopy={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  setCopied(false);
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Dock({
  exhibit,
  copied,
  onPick,
  onCopy,
}: {
  exhibit: AtlasExhibit;
  copied: boolean;
  onPick: (slug: string) => void;
  onCopy: () => void;
}) {
  const hallLabel = HALLS.find((h) => h.id === exhibit.hall)?.label ?? exhibit.hall;
  const kin = relatedExhibits(exhibit);
  return (
    <aside className="atlas-dock" aria-live="polite">
      <p className="atlas-kicker">
        {hallLabel} · {exhibit.story || "独立展品"}
      </p>
      <h2 className="text-balance">
        {exhibit.emoji} {exhibit.title}
      </h2>
      <p className="tagline text-pretty">{exhibit.tagline}</p>
      <MoodVis exhibit={exhibit} />
      <div className="atlas-actions">
        {exhibit.href ? (
          <a
            href={exhibit.href}
            onClick={() => trackCta("atlas-open", exhibit.slug)}
          >
            打开演示
          </a>
        ) : null}
        {exhibit.deckHref ? (
          <a className="ghost" href={exhibit.deckHref}>
            项目汇报
          </a>
        ) : null}
        {exhibit.github ? (
          <a className="ghost" href={exhibit.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        ) : null}
        <button type="button" className="ghost" onClick={onCopy}>
          {copied ? "已复制链接" : "复制本展链接"}
        </button>
      </div>
      {exhibit.metrics.length > 0 ? (
        <div className="atlas-bars">
          {exhibit.metrics.slice(0, 4).map((m) => (
            <div key={m.label} className="atlas-bar">
              <label>
                <span>{m.label}</span>
                <span className="tabular">{m.display}</span>
              </label>
              <i>
                <em style={{ width: `${metricWidth(m.value)}%`, background: exhibit.color }} />
              </i>
            </div>
          ))}
        </div>
      ) : null}
      <ul className="atlas-list">
        {exhibit.highlights.slice(0, 4).map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {exhibit.demo.length > 0 ? (
        <>
          <p className="atlas-kicker" style={{ marginTop: "0.75rem" }}>
            建议路径
          </p>
          <ul className="atlas-list">
            {exhibit.demo.map((d) => (
              <li key={d.title}>
                <strong>{d.title}</strong> · {d.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="atlas-chips">
        {exhibit.stack.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      {kin.length > 0 ? (
        <div className="atlas-related">
          <p className="atlas-kicker">相邻展品</p>
          {kin.map((r) => (
            <button key={r.slug} type="button" onClick={() => onPick(r.slug)}>
              {r.emoji} {r.title}
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
