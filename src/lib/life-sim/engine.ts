import type { EventCard, LifeRun, StatMap, WeightOption } from "./types";
import { normalizeOptions, withColors } from "@/lib/cs-life/wheel";
import type { WheelOption } from "@/lib/cs-life/types";
import { adaptCardOptions, echoFromPick, type EchoBias } from "./weighting";

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, Math.round(n)));
}

export function eligible(card: EventCard, run: LifeRun): boolean {
  if (card.minAge != null && run.age < card.minAge) return false;
  if (card.maxAge != null && run.age > card.maxAge) return false;
  if (card.includeFlags?.length) {
    if (!card.includeFlags.every((f) => run.flags.includes(f))) return false;
  }
  if (card.excludeFlags?.length) {
    if (card.excludeFlags.some((f) => run.flags.includes(f))) return false;
  }
  if (card.requireStats) {
    for (const [k, v] of Object.entries(card.requireStats)) {
      if ((run.stats[k] ?? 0) < v) return false;
    }
  }
  if (card.forbidStats) {
    for (const [k, v] of Object.entries(card.forbidStats)) {
      if ((run.stats[k] ?? 0) > v) return false;
    }
  }
  return true;
}

/**
 * 自适应权重：Logit + Softmax 温度 + flag/回声。
 * echo：上一选的瞬时偏置（后续影响）。
 */
export function adaptWeights(
  card: EventCard,
  run: LifeRun,
  echo?: EchoBias
): WeightOption[] {
  const recent = run.log.slice(-5).map((l) => l.pick);
  const scored = adaptCardOptions(
    card.options.map((o) => ({
      id: o.id,
      label: o.label,
      weight: o.weight,
    })),
    {
      stats: run.stats,
      flags: run.flags,
      recent,
      temperature: echo?.tempScale ?? 1,
    },
    {
      boostIds: [
        ...(card.adapt?.boostIds || []),
        ...(echo?.boostIds || []),
      ],
      cutIds: [...(card.adapt?.cutIds || []), ...(echo?.cutIds || [])],
      byStats: card.adapt?.byStats,
      scale: card.adapt?.scale,
    }
  );

  return card.options.map((o) => {
    const hit = scored.find((s) => s.id === o.id);
    return { ...o, weight: hit?.weight ?? o.weight };
  });
}

export function toWheel(options: WeightOption[]): WheelOption[] {
  return normalizeOptions(
    withColors(
      options.map((o) => ({
        id: o.id,
        label: o.label,
        weight: o.weight,
        effects: o.delta,
        enqueue: o.enqueue,
        flags: o.addFlags,
        meta: o.removeFlags?.length ? { removeFlags: o.removeFlags.join(",") } : undefined,
      }))
    )
  );
}

export function applyOption(run: LifeRun, card: EventCard, opt: WeightOption): LifeRun {
  const stats: StatMap = { ...run.stats };
  if (opt.delta) {
    for (const [k, v] of Object.entries(opt.delta)) {
      let dv = v;
      const mood = stats.mentality ?? stats.spr ?? stats.mood ?? 50;
      if (dv < 0 && mood >= 70) dv = Math.ceil(dv * 0.5);
      else if (dv < 0 && mood >= 55) dv = Math.ceil(dv * 0.75);
      stats[k] = clamp((stats[k] ?? 50) + dv);
    }
  }
  let flags = [...run.flags];
  for (const f of opt.removeFlags || []) flags = flags.filter((x) => x !== f);
  for (const f of opt.addFlags || []) {
    if (!flags.includes(f)) flags.push(f);
  }
  const log = [...run.log, { age: run.age, title: card.title, pick: opt.label }];
  return { ...run, stats, flags, log, queue: [...run.queue] };
}

export { echoFromPick };

/** 从池中按「与当前属性的亲和」抽事件 */
export function pickYearCard(pool: EventCard[], run: LifeRun, rng = Math.random): EventCard | null {
  const ok = pool.filter((c) => eligible(c, run));
  if (!ok.length) return null;
  const mood = run.stats.mentality ?? run.stats.spr ?? run.stats.mood ?? 50;
  const weighted = ok.map((c) => {
    let w = c.options.reduce((s, o) => s + o.weight, 0);
    // 卡面与主属性略亲和
    if (c.adapt?.byStats?.length) {
      const avg =
        c.adapt.byStats.reduce((s, k) => s + (run.stats[k] ?? 50), 0) /
        c.adapt.byStats.length;
      w *= 0.85 + avg / 200;
    }
    if (c.includeFlags?.length) w *= 1.15;
    if (/危机|失败|事故/.test(c.title) && mood < 40) w *= 1.2;
    return { c, w };
  });
  const sum = weighted.reduce((s, x) => s + x.w, 0);
  let r = rng() * sum;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.c;
  }
  return weighted[weighted.length - 1].c;
}

export function advanceAge(run: LifeRun, maxAge = 80): LifeRun {
  const age = run.age + 1;
  const ended = age >= maxAge || (run.stats.lif ?? 100) <= 0;
  return { ...run, age, ended };
}
