"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SpinWheel } from "./SpinWheel";
import { RadarChart } from "./RadarChart";
import { EventEditor } from "./EventEditor";
import {
  applyPick,
  createPlayer,
  currentEvent,
  insertCustomIntoQueue,
  optionsForPhase,
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
        const p = migratePlayer(pack.player);
        setPlayer(p);
        setPhase("summary");
        setResult("已载入分享生涯");
        setReady(true);
        return;
      }
    }
    const local = loadLocal();
    if (local) {
      setPlayer(migratePlayer(local.player));
      setPhase(local.phase as PhaseId);
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

  const onSpinEnd = useCallback(
    (opt: WheelOption) => {
      setSpinning(false);
      setResult(opt.label);
      const { player: nextP, next, subResult, rite: beat, echo: nextEcho } = applyPick(
        phase,
        player,
        opt,
        customs
      );
      setPlayer(nextP);
      setEcho(nextEcho);
      if (beat) setRite(beat);
      if (subResult) setResult(subResult);
      window.setTimeout(() => setPhase(next), 280);
    },
    [phase, player, customs]
  );

  const startSpin = () => {
    if (spinning || phase === "summary") return;
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
      <div className="csl-root" style={{ ["--ls-accent" as string]: "#d97706" }}>
        <header className="csl-top">
          <Link href="/life-sim" className="csl-back">
            ← 人生枢纽
          </Link>
          <span className="csl-pill">CS 人生模拟 · 退役典礼</span>
        </header>
        <main className="csl-main">
          <RiteCard rite={rite || riteForCs(player, false)} final />
          <p className="csl-sub">
            {player.country} · {player.team} · Major 冠 {player.majorWins}/{player.majors}
            {player.hasPartner ? " · 脱单" : ""}
          </p>
          <RadarChart stats={player.stats} judges={player.judges} />
          <pre className="csl-summary">{summaryText(player)}</pre>
          <ol className="csl-timeline">
            {player.events.map((e, i) => (
              <li key={`${e.year}-${i}`}>
                <strong>
                  {e.year} · {e.title}
                </strong>
                <span>{e.detail}</span>
              </li>
            ))}
          </ol>
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
            <Link href="/#works" className="csl-btn">
              作品档案
            </Link>
          </div>
          {toast && <p className="csl-toast">{toast}</p>}
          <p className="csl-note">
            赛果文案参考公开 Major；权重为 Logit+Softmax 示意，非 HLTV 实时爬取。附属玩法见人生枢纽。
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="csl-root" style={{ ["--ls-accent" as string]: "#d97706" }}>
      <header className="csl-top">
        <Link href="/life-sim" className="csl-back">
          ← 人生枢纽
        </Link>
        <button type="button" className="csl-pill" aria-label="当前事件">
          {title}
        </button>
        <button type="button" className="csl-ghost" onClick={restart}>
          重开
        </button>
      </header>

      <main className="csl-main">
        <p className="csl-kicker">AI 转盘 · 嵌套分支 · 自定义事件</p>
        <h1 className="csl-result">{result || "点下方开转"}</h1>
        {ev?.blurb && <p className="csl-sub">{ev.blurb}</p>}

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
              ? "转动 · 当前分支"
              : phase === "year_loop"
                ? `赛季菜单 · ${player.year}`
                : "转动转盘"}
        </button>

        {(phase === "event_spin" || phase === "year_loop" || player.history.length > 5) && (
          <section className="csl-panel">
            <h2>
              {player.year || "—"} · {player.team || "未加盟"}
            </h2>
            <p className="csl-meta">
              Major {player.majors} · 冠 {player.majorWins} · 队列 {player.queue.length} · 恋爱{" "}
              {player.hasPartner ? "有" : "无"}
            </p>
            <RadarChart stats={player.stats} judges={player.judges} size={200} />
            {phase === "event_spin" && (
              <ul className="csl-odds" aria-label="自适应占比">
                {options.map((o) => (
                  <li key={o.id}>
                    <i style={{ background: o.color }} />
                    {o.label}
                    <em>{Math.round(o.weight * 100)}%</em>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
                {m.year} {m.name} · {m.winner} &gt; {m.runnerUp}（{m.note}）
              </li>
            ))}
          </ul>
        </details>

        <details className="csl-history">
          <summary>轨迹（{player.history.length}）</summary>
          <ol>
            {player.history.map((h, i) => (
              <li key={i}>
                {h.label} → {h.picked}
              </li>
            ))}
          </ol>
        </details>

        {toast && <p className="csl-toast">{toast}</p>}
        <p className="csl-note">
          心态高：崩盘掉分减伤、负面扇区缩小。颜值/名气/忠诚自适应转会·恋爱·世界线。赛年队列按状态拼装，非固定剧本。Major
          决赛链：对手→地图 BP→半场→指挥对位→比分。更多领域见人生枢纽。
        </p>
        <ul className="csl-stats compact">
          {(Object.keys(SIX_LABELS) as (keyof typeof SIX_LABELS)[]).map((k) => (
            <li key={k}>
              <span>{SIX_LABELS[k]}</span>
              <strong>{Math.round(player.stats[k])}</strong>
            </li>
          ))}
        </ul>
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
    queue: Array.isArray(raw.queue) ? raw.queue : [],
    events: raw.events || [],
    history: raw.history || [],
    ctx: raw.ctx || {},
    grades: raw.grades || {},
    trophiesYear: raw.trophiesYear || 0,
    hasPartner: Boolean(raw.hasPartner),
  };
}
