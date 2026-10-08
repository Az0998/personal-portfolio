/**
 * 人生模拟权重算法（可复用到 CS / 凡人 / 水职场）
 *
 * 1. Logit 线性：log(w) += Σ β·z(stat) —— 属性差分进对数域，避免线性乘爆炸
 * 2. Softmax 温度 T：T 小更「一锤定音」，T 大更「命运摇摆」
 * 3. Flag 亲和：长程标签抬高/压低相关选项（后续影响）
 * 4. 近期回声衰减：刚出过的同类结果略降权，防连刷同一梗
 * 5. Soft floor：极低权仍保留 >0，保留黑马/喜剧感
 */

export type WeightCtx = {
  stats: Record<string, number>;
  flags: string[];
  /** 近期 pick 标签（option id 或 label 片段） */
  recent?: string[];
  /** Softmax 温度，默认 1；0.7 更尖锐，1.4 更平 */
  temperature?: number;
  moodKeys?: string[];
};

export type ScoredOption = {
  id: string;
  label: string;
  weight: number;
  /** 可选：属性亲和系数 { aim: 0.4, mentality: -0.2 } */
  affinity?: Record<string, number>;
  /** 可选：需要这些 flag 才抬权 */
  flagBoost?: string[];
  /** 可选：有这些 flag 则压权 */
  flagCut?: string[];
};

function z(stat: number, center = 50, span = 50) {
  return (stat - center) / span;
}

function moodOf(stats: Record<string, number>, keys = ["mentality", "spr", "mood"]) {
  for (const k of keys) {
    if (stats[k] != null) return stats[k];
  }
  return 50;
}

/** 单选项 logit（未 softmax） */
export function optionLogit(o: ScoredOption, ctx: WeightCtx): number {
  const base = Math.max(0.35, o.weight);
  let logit = Math.log(base);

  if (o.affinity) {
    for (const [k, beta] of Object.entries(o.affinity)) {
      logit += beta * z(ctx.stats[k] ?? 50);
    }
  }

  if (o.flagBoost?.length) {
    const hit = o.flagBoost.filter((f) => ctx.flags.includes(f)).length;
    logit += 0.35 * hit;
  }
  if (o.flagCut?.length) {
    const hit = o.flagCut.filter((f) => ctx.flags.includes(f)).length;
    logit -= 0.4 * hit;
  }

  // 软情感：负面词随心态压缩，高光随心态/均值抬
  const mood = moodOf(ctx.stats, ctx.moodKeys);
  if (/崩|寄|失败|入狱|抑郁|摆烂|梦碎|tilt|MRQ|D\b|E\b|失常|危机/.test(o.label)) {
    logit += Math.log(0.55 + (100 - mood) / 160);
  }
  if (/S\+|冠军|暴富|脱单|录取|升职|神勇|清北|立功|过审|幸福/.test(o.label)) {
    const avg =
      Object.values(ctx.stats).reduce((s, v) => s + v, 0) /
      Math.max(1, Object.keys(ctx.stats).length);
    logit += Math.log(0.7 + mood / 200 + avg / 220);
  }

  // 回声衰减：近期重复标签
  if (ctx.recent?.length) {
    const echo = ctx.recent.filter(
      (r) => r === o.id || o.label.includes(r) || r.includes(o.id)
    ).length;
    if (echo) logit -= 0.25 * echo;
  }

  return logit;
}

/** Softmax 归一（可保留相对比例给转盘） */
export function softmaxWeights(
  options: ScoredOption[],
  ctx: WeightCtx
): { id: string; label: string; weight: number }[] {
  const T = Math.max(0.35, ctx.temperature ?? 1);
  const logits = options.map((o) => optionLogit(o, ctx) / T);
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return options.map((o, i) => ({
    id: o.id,
    label: o.label,
    // soft floor：黑马不低于总和的 1.2%
    weight: Math.max(0.012, exps[i] / sum),
  }));
}

/**
 * 卡片级 adapt：把 boost/cut + byStats 编成 affinity，再 softmax。
 * scale≈0.4 时约等于旧版「均值抬/压」强度。
 */
export function adaptCardOptions(
  options: {
    id: string;
    label: string;
    weight: number;
    affinity?: Record<string, number>;
    flagBoost?: string[];
    flagCut?: string[];
  }[],
  ctx: WeightCtx,
  adapt?: {
    boostIds?: string[];
    cutIds?: string[];
    byStats?: string[];
    scale?: number;
  }
): { id: string; label: string; weight: number }[] {
  const keys = adapt?.byStats || Object.keys(ctx.stats).slice(0, 3);
  const scale = adapt?.scale ?? 0.4;
  const scored: ScoredOption[] = options.map((o) => {
    const affinity = { ...(o.affinity || {}) };
    for (const k of keys) {
      const prev = affinity[k] ?? 0;
      if (adapt?.boostIds?.includes(o.id)) affinity[k] = prev + scale;
      if (adapt?.cutIds?.includes(o.id)) affinity[k] = prev - scale;
    }
    return { ...o, affinity };
  });
  return softmaxWeights(scored, ctx);
}

/** 后续影响：根据刚选结果，给「下一张卡」选项打瞬时偏置（不改永久属性） */
export type EchoBias = { boostIds?: string[]; cutIds?: string[]; tempScale?: number };

export function echoFromPick(pickId: string, pickLabel: string): EchoBias {
  if (/冠军|决赛|录取|升职|立功|过审|S\+/.test(pickLabel) || /final|gold|ship/.test(pickId)) {
    return { boostIds: ["final", "ship", "gold", "promote", "pass"], tempScale: 0.9 };
  }
  if (/崩|梦碎|失败|危机|打回|事故/.test(pickLabel) || /mrq|fail|crisis|bug/.test(pickId)) {
    return { cutIds: ["final", "ship", "gold"], boostIds: ["recover", "mentor", "ok"], tempScale: 1.15 };
  }
  return { tempScale: 1 };
}
