"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SpinWheel } from "./SpinWheel";
import { RadarChart } from "./RadarChart";
import { EventEditor } from "./EventEditor";
import { CareerTimeline } from "./CareerTimeline";
import {
  applyPick,
  createPlayer,
  currentEvent,
  eventsForYear,
  insertCustomIntoQueue,
  optionsForPhase,
  originProgress,
  phaseTitle,
  summaryText,
} from "@/lib/cs-life/sim";
import { SIX_LABELS } from "@/lib/cs-life/catalog";
import { MAJOR_LORE } from "@/lib/cs-life/lore";
import { loadCustoms, saveCustoms } from "@/lib/cs-life/custom-store";
import type { CustomEventDef, PhaseId, PlayerState, WheelOption } from "@/lib/cs-life/types";
import {
  clearLocal,
  decodeShare,
  loadLocal,
  saveLocal,
  shareUrl,
} from "@/lib/cs-life/persist";
import { RiteCard } from "@/components/life-sim/RiteCard";
import type { RiteBeat } from "@/lib/life-sim/rite";
import type { EchoBias } from "@/lib/life-sim/weighting";
import { riteForCs } from "@/lib/life-sim/rite";
import { csAtmosphere, previewQueueTitles } from "@/lib/life-sim/flavor";

export function CsLifeApp() {
  const [phase, setPhase] = useState<PhaseId>("origin_region");
  const [player, setPlayer] = useState<PlayerState>(() => createPlayer());
  const [customs, setCustoms] = useState<CustomEventDef[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [rite, setRite] = useState<RiteBeat | null>(null);
  const [echo, setEcho] = useState<EchoBias | undefined>();

  useEffect(() => {
    setCustoms(loadCustoms());
    const q = new URLSearchParams(window.location.search);
    const snap = q.get("snap");
    if (snap) {
      const pack = decodeShare(snap);
      if (pack) {
        setPlayer(migratePlayer(pack.player));
        setPhase("summary");
        setResult("已载入分享生涯");
        setReady(true);
        return;
      }
    }
    const local = loadLocal();
    if (local) {
      const p = migratePlayer(local.player);
      let ph = local.phase as PhaseId;
      // 旧档若已有 year 却无战队，拉回选队
      if (!p.team && (ph === "year_loop" || ph === "event_spin" || ph === "season_recap")) {
        ph = "team_pick";
      }
      setPlayer(p);
      setPhase(ph);
      setResult(local.player.history?.at(-1)?.picked || "");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || phase === "summary") return;
    saveLocal(player, phase);
  }, [player, phase, ready]);

  const options = useMemo(
    () => optionsForPhase(phase, player, customs, echo),
    [phase, player, customs, echo]
  );
  const title = phaseTitle(phase, player);
  const ev = phase === "event_spin" ? currentEvent(player) : null;
  const progress = originProgress(phase);
  const inCareer =
    phase === "year_loop" ||
    phase === "event_spin" ||
    phase === "season_recap" ||
    player.history.length > 8;
  const yearEvents = eventsForYear(player, player.year);
  const atmos = csAtmosphere(player);
  const queuePreview = previewQueueTitles(player.queue.map((q) => q.title));

  const onSpinEnd = useCallback(
    (opt: WheelOption) => {
      setSpinning(false);
      const { player: nextP, next, subResult, rite: beat, echo: nextEcho } = applyPick(
        phase,
        player,
        opt,
        customs
      );
      setPlayer(nextP);
      setEcho(nextEcho);
      if (beat) setRite(beat);
      setResult(subResult || opt.label);
      window.setTimeout(() => setPhase(next), 240);
    },
    [phase, player, customs]
  );

  const startSpin = () => {
    if (spinning || phase === "summary" || rite) return;
    setSpinning(true);
  };

  const restart = () => {
    clearLocal();
    setPlayer(createPlayer());
    setPhase("origin_region");
    setResult("");
    setRite(null);
    setEcho(undefined);
    setToast("已开新档");
    const u = new URL(window.location.href);
    u.searchParams.delete("snap");
    window.history.replaceState({}, "", u.pathname);
  };

  const doShare = async () => {
    const url = shareUrl(player);
    try {
      await navigator.clipboard.writeText(url);
      setToast("分享链接已复制");
    } catch {
      setToast(url);
    }
  };

  const insertCustom = (def: CustomEventDef) => {
    const next = insertCustomIntoQueue(player, def);
    setPlayer(next);
    setPhase("event_spin");
    setResult(`已插入：${def.title}`);
    setShowEditor(false);
    setToast("自定义事件已压入队列顶端");
  };

  const saveLib = (def: CustomEventDef) => {
    const next = [def, ...customs].slice(0, 40);
    setCustoms(next);
    saveCustoms(next);
  };

  if (!ready) return <div className="csl-root">加载转盘…</div>;

  if (phase === "summary") {
    return (
      <div className="csl-root">
        <header className="csl-top">
          <Link href="/life-sim" className="csl-back">
            ← 人生枢纽
          </Link>
          <span className="csl-pill">退役典礼</span>
          <button type="button" className="csl-ghost" onClick={restart}>
            再转
          </button>
        </header>
        <main className="csl-main">
          <RiteCard rite={rite || riteForCs(player, false)} final />
          <div className="csl-status">
            <span className="csl-chip accent">{player.country || "—"}</span>
            <span className="csl-chip">{player.team || "无战队"}</span>
            <span className="csl-chip">
              Major 冠 {player.majorWins}/{player.majors}
            </span>
            {player.hasPartner && <span className="csl-chip">脱单</span>}
          </div>
          <RadarChart stats={player.stats} judges={player.judges} />
          <pre className="csl-summary">{summaryText(player)}</pre>
          <CareerTimeline events={player.events} title="生涯时间线" />
          <div className="csl-actions">
            <button type="button" className="csl-btn primary" onClick={doShare}>
              复制分享链接
            </button>
            <button
              type="button"
              className="csl-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(summaryText(player));
                setToast("摘要已复制");
              }}
            >
              复制摘要
            </button>
            <button type="button" className="csl-btn" onClick={restart}>
              再转一生
            </button>
            <Link href="/life-sim" className="csl-btn">
              人生枢纽
            </Link>
          </div>
          {toast && <p className="csl-toast">{toast}</p>}
          <p className="csl-note">
            赛果为公开 Major 考据示意；权重 Logit+Softmax，非 HLTV 实时爬取。
          </p>
        </main>
      </div>
    );
  }

  if (phase === "season_recap") {
    return (
      <div className="csl-root">
        <header className="csl-top">
          <Link href="/life-sim" className="csl-back">
            ← 人生枢纽
          </Link>
          <span className="csl-pill">{player.year} 赛季总结</span>
          <button type="button" className="csl-ghost" onClick={restart}>
            重开
          </button>
        </header>
        <main className="csl-main">
          {rite && <RiteCard rite={rite} onDismiss={() => setRite(null)} />}
          <div className="csl-recap-hero">
            <h2>{player.year} 赛季落幕</h2>
            <p>
              {player.team || "无战队"} · 本季冠军 {player.trophiesYear} 座 · Major 生涯{" "}
              {player.majors} 次深跑 / 冠 {player.majorWins}
              {player.hasPartner ? " · 已脱单" : ""}
            </p>
          </div>
          <CareerTimeline
            events={yearEvents}
            year={player.year}
            title="本赛季时间线"
          />
          <p className="csl-stage">转盘选择下一步</p>
          <SpinWheel options={options} spinning={spinning} onSpinEnd={onSpinEnd} />
          <button
            type="button"
            className="csl-btn primary csl-spin"
            onClick={startSpin}
            disabled={spinning || Boolean(rite)}
          >
            {spinning ? "转动中…" : "转动 · 赛季抉择"}
          </button>
          <RadarChart stats={player.stats} judges={player.judges} size={180} />
          <details className="csl-history">
            <summary>完整生涯时间线（{player.events.length}）</summary>
            <CareerTimeline events={player.events} compact />
          </details>
          {toast && <p className="csl-toast">{toast}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="csl-root">
      <header className="csl-top">
        <Link href="/life-sim" className="csl-back">
          ← 枢纽
        </Link>
        <span className="csl-pill" title={title}>
          {title}
        </span>
        <button type="button" className="csl-ghost" onClick={restart}>
          重开
        </button>
      </header>

      <main className="csl-main">
        {progress < 1 && (
          <div className="csl-progress" aria-hidden>
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}

        <p className="csl-kicker">CS 职业人生 · 命运转盘</p>
        <p className="csl-stage">{title}</p>
        <h1 className="csl-result">{result || "点下方开转"}</h1>
        <p className="csl-sub csl-atmos">{ev?.blurb || atmos}</p>
        {phase === "team_pick" && !ev?.blurb && (
          <p className="csl-sub">先定效力战队，再进入开局评定。</p>
        )}
        {phase === "event_spin" && player.queue.length > 1 && (
          <p className="csl-queue-preview">接下来：{queuePreview}</p>
        )}
        {phase === "year_loop" && (
          <p className="csl-queue-preview">推进后将生成训练营、杯赛、Major 与随机支线</p>
        )}

        {inCareer && (
          <div className="csl-status">
            <span className="csl-chip accent">{player.year || "—"}</span>
            <span className="csl-chip">{player.team || "未加盟"}</span>
            <span className="csl-chip">
              Major {player.majors} · 冠 {player.majorWins}
            </span>
            {phase === "event_spin" && (
              <span className="csl-chip">队列 {player.queue.length}</span>
            )}
          </div>
        )}

        {rite && <RiteCard rite={rite} onDismiss={() => setRite(null)} />}

        <SpinWheel options={options} spinning={spinning} onSpinEnd={onSpinEnd} />

        <button
          type="button"
          className="csl-btn primary csl-spin"
          onClick={startSpin}
          disabled={spinning || Boolean(rite)}
          aria-label="转动转盘"
        >
          {spinning
            ? "转动中…"
            : phase === "event_spin"
              ? "转动 · 当前事件"
              : phase === "year_loop"
                ? `推进 ${player.year} 赛季`
                : phase === "team_pick"
                  ? "转动 · 选战队"
                  : "转动转盘"}
        </button>

        {phase === "event_spin" && (
          <section className="csl-panel">
            <h2>扇区占比</h2>
            <p className="csl-meta">随属性 / 上一选回声自适应</p>
            <ul className="csl-odds" aria-label="自适应占比">
              {options.map((o) => (
                <li key={o.id}>
                  <i style={{ background: o.color }} />
                  {o.label}
                  <em>{Math.round(o.weight * 100)}%</em>
                </li>
              ))}
            </ul>
          </section>
        )}

        {inCareer && (
          <section className="csl-panel">
            <h2>
              {player.team || "未加盟"} · 能力雷达
            </h2>
            <RadarChart stats={player.stats} judges={player.judges} size={200} />
            <ul className="csl-stats">
              {(Object.keys(SIX_LABELS) as (keyof typeof SIX_LABELS)[]).map((k) => (
                <li key={k}>
                  <span>{SIX_LABELS[k]}</span>
                  <strong>{Math.round(player.stats[k])}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {player.events.length > 0 && phase !== "event_spin" && (
          <details className="csl-history" open={phase === "year_loop"}>
            <summary>时间线（{player.events.length}）</summary>
            <CareerTimeline events={player.events} compact />
          </details>
        )}

        <div className="csl-actions">
          <button type="button" className="csl-btn" onClick={() => setShowEditor((v) => !v)}>
            {showEditor ? "收起编辑器" : "自定义事件"}
          </button>
          <button type="button" className="csl-btn" onClick={doShare}>
            分享当前档
          </button>
        </div>

        {showEditor && <EventEditor onInsert={insertCustom} onSaveLibrary={saveLib} />}

        {customs.length > 0 && (
          <details className="csl-history">
            <summary>已存自定义（{customs.length}）</summary>
            <ul>
              {customs.map((c) => (
                <li key={c.id}>
                  <button type="button" className="csl-linkish" onClick={() => insertCustom(c)}>
                    插入「{c.title}」
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        <details className="csl-history">
          <summary>考据备忘 · CS2 Major</summary>
          <ul>
            {MAJOR_LORE.map((m) => (
              <li key={m.name}>
                {m.year} {m.name} · {m.winner} &gt; {m.runnerUp}
              </li>
            ))}
          </ul>
        </details>

        {toast && <p className="csl-toast">{toast}</p>}
        <p className="csl-note">
          出道年之后会单独转「加盟战队」。冠军数 / 补强人数等选项已写成完整句子。每赛季结束进入时间线总结，再决定下一年或退役。
        </p>
      </main>
    </div>
  );
}

function migratePlayer(raw: PlayerState): PlayerState {
  const base = createPlayer(raw.seed || `${Date.now()}`);
  return {
    ...base,
    ...raw,
    stats: { ...base.stats, ...raw.stats },
    judges: { ...base.judges, ...(raw as PlayerState).judges },
    queue: Array.isArray(raw.queue)
      ? raw.queue.map((q) =>
          q.id === "team_pick_cis" ? { ...q, id: "team_pick" } : q
        )
      : [],
    events: raw.events || [],
    history: raw.history || [],
    ctx: raw.ctx || {},
    grades: raw.grades || {},
    trophiesYear: raw.trophiesYear || 0,
    hasPartner: Boolean(raw.hasPartner),
    team: raw.team || undefined,
  };
}
