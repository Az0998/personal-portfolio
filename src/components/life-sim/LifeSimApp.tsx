"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SpinWheel } from "@/components/cs-life/SpinWheel";
import { RiteCard } from "./RiteCard";
import { createRun, domainById } from "@/lib/life-sim/domains";
import {
  applyWheelPick,
  currentCard,
  optionsForRun,
  summaryLines,
} from "@/lib/life-sim/runner";
import type { RiteBeat } from "@/lib/life-sim/rite";
import type { EchoBias } from "@/lib/life-sim/weighting";
import type { LifeRun } from "@/lib/life-sim/types";
import type { WheelOption } from "@/lib/cs-life/types";
import { lifeAtmosphere, previewQueueTitles } from "@/lib/life-sim/flavor";

const STORAGE_KEY = (id: string) => `life-sim:${id}:v1`;

export function LifeSimApp({ domainId }: { domainId: string }) {
  const meta = domainById(domainId);
  const [run, setRun] = useState<LifeRun>(() => createRun(domainId));
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [ready, setReady] = useState(false);
  const [rite, setRite] = useState<RiteBeat | null>(null);
  const [echo, setEcho] = useState<EchoBias | undefined>();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(domainId));
      if (raw) setRun(JSON.parse(raw) as LifeRun);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [domainId]);

  useEffect(() => {
    if (!ready || run.ended) return;
    localStorage.setItem(STORAGE_KEY(domainId), JSON.stringify(run));
  }, [run, ready, domainId]);

  const options = useMemo(() => optionsForRun(run, echo), [run, echo]);
  const card = currentCard(run);
  const title = card?.title || (run.ended ? "人生落定" : `${run.age} 岁 · 年度菜单`);
  const atmos = lifeAtmosphere(run);
  const queueHint = previewQueueTitles(run.queue.map((c) => c.title));

  const onSpinEnd = useCallback(
    (opt: WheelOption) => {
      setSpinning(false);
      const { run: next, sub, rite: beat, echo: nextEcho } = applyWheelPick(run, opt);
      setRun(next);
      setResult(sub || opt.label);
      setEcho(nextEcho);
      if (beat) setRite(beat);
    },
    [run]
  );

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY(domainId));
    setRun(createRun(domainId));
    setResult("");
    setRite(null);
    setEcho(undefined);
  };

  if (!meta) {
    return (
      <div className="ls-root">
        <p>未知领域</p>
        <Link href="/life-sim">返回枢纽</Link>
      </div>
    );
  }

  if (!ready) return <div className="ls-root">加载…</div>;

  if (run.ended) {
    return (
      <div className="ls-root" style={{ ["--ls-accent" as string]: meta.accent }}>
        <header className="ls-top">
          <Link href="/life-sim" className="ls-back">
            ← 人生枢纽
          </Link>
          <span className="ls-pill">{meta.title} · 典礼</span>
        </header>
        <main className="ls-main">
          {rite ? (
            <RiteCard rite={rite} final />
          ) : (
            <h1>落定 · {run.age} 岁</h1>
          )}
          <pre className="ls-summary">{summaryLines(run)}</pre>
          <ol className="ls-log">
            {run.log.map((l, i) => (
              <li key={i}>
                <strong>
                  {l.age} · {l.title}
                </strong>
                <span>{l.pick}</span>
              </li>
            ))}
          </ol>
          <div className="ls-actions-row">
            <button type="button" className="ls-btn primary" onClick={restart}>
              再活一次
            </button>
            <Link href="/life-sim" className="ls-btn">
              换个领域
            </Link>
            <Link href="/#works" className="ls-btn">
              回作品档案
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ls-root" style={{ ["--ls-accent" as string]: meta.accent }}>
      <header className="ls-top">
        <Link href="/life-sim" className="ls-back">
          ← 人生枢纽
        </Link>
        <span className="ls-pill">{title}</span>
        <button type="button" className="ls-ghost" onClick={restart}>
          重开
        </button>
      </header>
      <main className="ls-main">
        <p className="ls-kicker">{meta.tagline}</p>
        <h1 className="ls-result">{result || "点下方开转"}</h1>
        <p className="ls-sub">{card?.blurb || atmos}</p>
        {run.queue.length > 1 && (
          <p className="ls-queue">{queueHint}</p>
        )}

        {rite && !run.ended && (
          <RiteCard rite={rite} onDismiss={() => setRite(null)} />
        )}

        <SpinWheel options={options} spinning={spinning} onSpinEnd={onSpinEnd} />

        <button
          type="button"
          className="ls-btn primary"
          disabled={spinning || Boolean(rite)}
          onClick={() => setSpinning(true)}
        >
          {spinning ? "转动中…" : card ? "转动 · 当前事件" : `推进 · ${run.age} 岁`}
        </button>

        <ul className="ls-stats">
          {meta.stats.map((s) => (
            <li key={s.key}>
              <span>{s.label}</span>
              <strong>{Math.round(run.stats[s.key] ?? 0)}</strong>
            </li>
          ))}
        </ul>

        {run.flags.length > 0 && (
          <p className="ls-flags">
            印记：{run.flags.slice(-8).join(" · ")}
            {run.flags.length > 8 ? "…" : ""}
          </p>
        )}

        <details className="ls-history">
          <summary>轨迹（{run.log.length}）</summary>
          <ol>
            {run.log.map((l, i) => (
              <li key={i}>
                {l.age}岁 {l.title} → {l.pick}
              </li>
            ))}
          </ol>
        </details>

        <p className="ls-note">
          权重用 Logit + Softmax；上一选有回声。节点年龄触发典礼。
          {["xianxia", "isekai", "academy", "mecha"].includes(domainId)
            ? " 本包为同人题材风 Demo：原创桥段与代称，与任何官方 IP 无关。"
            : ""}
        </p>
      </main>
    </div>
  );
}
