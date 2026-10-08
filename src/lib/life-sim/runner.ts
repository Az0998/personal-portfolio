import {
  adaptWeights,
  advanceAge,
  applyOption,
  echoFromPick,
  eligible,
  pickYearCard,
  toWheel,
} from "./engine";
import { domainById, poolFor, resolveCard } from "./domains";
import { riteForLifeRun, shouldTriggerLifeRite, type RiteBeat } from "./rite";
import type { EventCard, LifeRun, WeightOption } from "./types";
import type { WheelOption } from "@/lib/cs-life/types";
import type { EchoBias } from "./weighting";

const MAX_AGE: Record<string, number> = { mortal: 85, hydro: 55, night: 52 };

export type ApplyResult = {
  run: LifeRun;
  sub?: string;
  rite?: RiteBeat;
  echo?: EchoBias;
};

export function currentCard(run: LifeRun): EventCard | null {
  return run.queue[0] || null;
}

export function optionsForRun(run: LifeRun, echo?: EchoBias): WheelOption[] {
  const card = currentCard(run);
  if (!card) {
    return toWheel([
      { id: "next_year", label: "推进一年", weight: 70 },
      { id: "retire", label: "落幕典礼", weight: 30 },
    ]);
  }
  return toWheel(adaptWeights(card, run, echo));
}

function enqueueResolved(run: LifeRun, ids: string[] | undefined): EventCard[] {
  if (!ids?.length) return [];
  const out: EventCard[] = [];
  for (const id of ids) {
    const card = resolveCard(run.domainId, id, run);
    if (card) out.push({ ...card, options: card.options.map((o) => ({ ...o })) });
  }
  return out;
}

export function seedAgeQueue(run: LifeRun): EventCard[] {
  const pool = poolFor(run.domainId);
  const q: EventCard[] = [];
  const first = pickYearCard(pool, run);
  if (first) q.push(first);
  const rest = pool.filter((c) => c.id !== first?.id && eligible(c, run));
  if (rest.length && Math.random() > 0.35) {
    const second = pickYearCard(rest, run);
    if (second) q.push(second);
  }
  return q;
}

export function applyWheelPick(run: LifeRun, opt: WheelOption): ApplyResult {
  const head = run.queue[0];
  const meta = domainById(run.domainId);

  if (!head) {
    if (opt.id === "retire") {
      const ended = { ...run, ended: true };
      const rite = meta ? riteForLifeRun(ended, meta, true) : undefined;
      return { run: ended, sub: "人生落幕", rite };
    }
    let next = { ...run, queue: seedAgeQueue(run) };
    if (!next.queue.length) {
      next = advanceAge(next, MAX_AGE[run.domainId] || 80);
      if (next.ended) {
        const rite = meta ? riteForLifeRun(next, meta, true) : undefined;
        return { run: next, sub: "岁月到头", rite };
      }
      next = { ...next, queue: seedAgeQueue(next) };
    }
    return { run: next, sub: opt.label };
  }

  const removeFlags =
    typeof opt.meta?.removeFlags === "string"
      ? String(opt.meta.removeFlags)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
  const wopt: WeightOption = {
    id: opt.id,
    label: opt.label,
    weight: opt.weight,
    delta: opt.effects,
    addFlags: opt.flags,
    removeFlags,
    enqueue: opt.enqueue,
  };

  let next = applyOption(run, head, wopt);
  next.queue = next.queue.slice(1);
  const children = enqueueResolved(next, opt.enqueue);
  next.queue = [...children, ...next.queue];

  const echo = echoFromPick(opt.id, opt.label);
  let rite: RiteBeat | undefined;

  if (!next.queue.length) {
    next = advanceAge(next, MAX_AGE[run.domainId] || 80);
    if (next.ended && meta) {
      rite = riteForLifeRun(next, meta, true);
    } else if (meta && shouldTriggerLifeRite(next)) {
      rite = riteForLifeRun(next, meta, false);
    }
  }

  return { run: next, sub: opt.label, rite, echo };
}

export function summaryLines(run: LifeRun): string {
  const meta = domainById(run.domainId);
  const rite = meta ? riteForLifeRun(run, meta, true) : null;
  const stats = Object.entries(run.stats)
    .map(([k, v]) => `${k}:${Math.round(v)}`)
    .join(" · ");
  return [
    rite ? `【${rite.stage}】${rite.epithet}` : `【${run.domainId}】`,
    rite?.verse || "",
    `年龄 ${run.age}${run.ended ? " · 已落定" : ""}`,
    `属性 ${stats}`,
    `印记: ${run.flags.join(", ") || "—"}`,
    ...run.log.slice(-10).map((l) => `${l.age}岁 · ${l.title} → ${l.pick}`),
  ]
    .filter(Boolean)
    .join("\n");
}
