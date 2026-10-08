import {
  FINAL_OPPONENTS,
  MAP_POOL,
  REINFORCE_POOL_CIS,
  majorForYear,
} from "./lore";
import { TEAMS_BY_REGION } from "./catalog";
import type {
  CustomEventDef,
  PlayerState,
  RuntimeEvent,
  StatDelta,
  WheelOption,
} from "./types";
import { normalizeOptions, withColors } from "./wheel";
import { adaptCardOptions, echoFromPick, type EchoBias } from "@/lib/life-sim/weighting";
import {
  formatChampLabel,
  formatPerfGrade,
  formatReinforceCount,
  REGION_LABEL,
  regionKeyFromLabel,
} from "./format";

export function blankJudges() {
  return { appearance: 55, loyalty: 60, fame: 40, form: 55, clutch: 50 };
}

/** CS：Logit+Softmax + 场景亲和 + 上一选回声 */
export function adaptOptions(
  ev: RuntimeEvent,
  p: PlayerState,
  echo?: EchoBias
): WheelOption[] {
  const stats: Record<string, number> = { ...p.stats, ...p.judges };
  const flags: string[] = [];
  if (p.isIgl) flags.push("igl");
  if (p.hasPartner) flags.push("partner");
  if (p.judges.loyalty >= 75) flags.push("loyal");
  if (p.judges.fame >= 65) flags.push("famous");

  const recent = p.history.slice(-6).map((h) => h.picked);
  const byStats = (ev.adapt?.by || ["mentality", "form"]) as string[];

  const scored = adaptCardOptions(
    ev.options.map((o) => {
      const affinity: Record<string, number> = {};
      if ((o.id === "yes" || o.label === "是") && (ev.id === "transfer" || ev.id === "worldline_shiro")) {
        affinity.fame = 0.35;
        affinity.loyalty = -0.45;
      }
      if (ev.id === "girlfriend" && o.id === "no") affinity.mentality = -0.35;
      if (ev.id === "girlfriend" && o.id === "yes") {
        affinity.appearance = 0.5;
        affinity.fame = 0.3;
      }
      if (ev.id === "igl_read" && o.id === "hero_read") {
        affinity.leadership = 0.55;
        affinity.sense = 0.35;
      }
      if (ev.id === "half_score" && /3:9|2:10|背水|濒临/.test(o.label)) {
        affinity.clutch = 0.4;
      }
      return {
        id: o.id,
        label: o.label,
        weight: o.weight,
        affinity,
        flagBoost: o.id === "hero_read" && p.isIgl ? ["igl"] : undefined,
      };
    }),
    {
      stats,
      flags,
      recent,
      temperature: echo?.tempScale ?? 1,
      moodKeys: ["mentality"],
    },
    {
      boostIds: [...(ev.adapt?.boostIds || []), ...(echo?.boostIds || [])],
      cutIds: [...(ev.adapt?.cutIds || []), ...(echo?.cutIds || [])],
      byStats,
      scale: ev.adapt?.scale ?? 0.4,
    }
  );

  return normalizeOptions(
    withColors(
      ev.options.map((o) => {
        const hit = scored.find((s) => s.id === o.id);
        return {
          id: o.id,
          label: o.label,
          weight: hit?.weight ?? o.weight,
          meta: o.meta,
          effects: o.effects,
          enqueue: o.enqueue,
          flags: o.flags,
        };
      })
    )
  );
}

export { echoFromPick };

export function customToRuntime(c: CustomEventDef): RuntimeEvent {
  return {
    id: c.id,
    title: c.title,
    blurb: c.blurb,
    kind: "custom",
    options: withColors(
      c.options.map((o) => ({
        id: o.id,
        label: o.label,
        weight: o.weight,
        effects: o.effects,
        enqueue: o.enqueue,
        flags: o.flags,
      }))
    ),
  };
}

/** —— 模板工厂 —— */

export function evtWorldlineShiro(p: PlayerState): RuntimeEvent {
  const leave = Math.max(15, 40 - p.judges.loyalty * 0.25 + p.judges.fame * 0.15);
  return {
    id: "worldline_shiro",
    title: "世界线变动 · sh1ro 是否出走 Spirit",
    blurb: "考据趣味分支：顶级 AWP 去留意向是经典世界线话题（示意）。",
    kind: "worldline",
    adapt: { boostIds: ["yes"], cutIds: ["no"], by: ["loyalty", "fame"], scale: 0.5 },
    options: withColors([
      {
        id: "yes",
        label: "出走 · 阵容动荡",
        weight: leave,
        effects: { loyalty: -8, fame: 6, mentality: -3, form: -2 },
        flags: ["roster_chaos"],
        enqueue: ["team_pick"],
      },
      {
        id: "no",
        label: "留下 · 世界线平静",
        weight: 100 - leave,
        effects: { loyalty: 4, mentality: 2 },
      },
    ]),
  };
}

export function evtTeamPick(regionLabel?: string): RuntimeEvent {
  const key = regionKeyFromLabel(regionLabel);
  const pool = TEAMS_BY_REGION[key] || TEAMS_BY_REGION.eu;
  const name = REGION_LABEL[key] || regionLabel || "本区";
  return {
    id: "team_pick",
    title: `选择效力战队 · ${name}`,
    blurb: "转盘决定你加盟哪支队伍（开局与转会都会用到）。",
    kind: "team",
    options: withColors(
      pool.map((t) => ({ id: t, label: t, weight: 1, flags: [`join:${t}`] }))
    ),
  };
}

export function evtChampCount(year: number, p: PlayerState): RuntimeEvent {
  const o = (p.stats.aim + p.stats.sense + p.judges.form) / 3;
  return {
    id: "champ_count",
    title: `${year} 赛季 · 杯赛冠军数`,
    blurb: "本赛季个人随队拿到的冠军数量（示意）。",
    kind: "form",
    adapt: { boostIds: ["3", "4", "5p"], cutIds: ["0"], by: ["form", "aim"], scale: 0.6 },
    options: withColors([
      { id: "0", label: formatChampLabel("0"), weight: Math.max(8, 40 - o * 0.25), flags: ["trophies:0"] },
      { id: "1", label: formatChampLabel("1"), weight: 24, flags: ["trophies:1"] },
      { id: "2", label: formatChampLabel("2"), weight: 18, flags: ["trophies:2"] },
      { id: "3", label: formatChampLabel("3"), weight: 10, flags: ["trophies:3"] },
      { id: "4", label: formatChampLabel("4"), weight: 5, flags: ["trophies:4"] },
      { id: "5", label: formatChampLabel("5"), weight: 3, flags: ["trophies:5"] },
      { id: "5p", label: formatChampLabel("5p"), weight: 2, flags: ["trophies:6"] },
    ]),
  };
}

export function evtTransfer(p: PlayerState): RuntimeEvent {
  const yes = Math.max(12, 55 - p.judges.loyalty * 0.4 + (70 - p.judges.form) * 0.2);
  return {
    id: "transfer",
    title: `${p.year} 赛季 · 是否转会`,
    blurb: `当前效力：${p.team || "未定"}。忠诚高更易留队。`,
    kind: "team",
    adapt: { boostIds: ["yes"], by: ["loyalty", "form"], scale: 0.55 },
    options: withColors([
      {
        id: "yes",
        label: "转会离开",
        weight: yes,
        effects: { loyalty: -6, fame: 3, mentality: -2 },
        enqueue: ["team_pick", "reinforce_count"],
        flags: ["did_transfer"],
      },
      {
        id: "no",
        label: "留在原队",
        weight: 100 - yes,
        effects: { loyalty: 3, attitude: 1 },
      },
    ]),
  };
}

export function evtReinforceCount(): RuntimeEvent {
  return {
    id: "reinforce_count",
    title: "转会窗 · 补强几人",
    blurb: "新东家或原队引入的补强名额。",
    kind: "team",
    options: withColors([
      { id: "1", label: formatReinforceCount("1"), weight: 42, enqueue: ["reinforce_who"], flags: ["reinforce:1"] },
      { id: "2", label: formatReinforceCount("2"), weight: 32, enqueue: ["reinforce_who", "reinforce_who"], flags: ["reinforce:2"] },
      { id: "3", label: formatReinforceCount("3"), weight: 14, enqueue: ["reinforce_who"], flags: ["reinforce:3"] },
      { id: "4", label: formatReinforceCount("4"), weight: 8, flags: ["reinforce:4"] },
      {
        id: "5",
        label: formatReinforceCount("5"),
        weight: 4,
        effects: { form: -8, mentality: -4, fame: 5 },
        flags: ["reinforce:5"],
      },
    ]),
  };
}

export function evtReinforceWho(): RuntimeEvent {
  return {
    id: "reinforce_who",
    title: "补强人员",
    kind: "team",
    options: withColors(
      REINFORCE_POOL_CIS.map((n) => ({
        id: n,
        label: n,
        weight: 1,
        effects: { form: 2, fame: 1 } as StatDelta,
        flags: [`signed:${n}`],
      }))
    ),
  };
}

export function evtGirlfriend(p: PlayerState): RuntimeEvent {
  const yes = Math.max(8, Math.min(70, p.judges.appearance * 0.55 + p.judges.fame * 0.2 - 10));
  return {
    id: "girlfriend",
    title: "感情线 · 是否脱单",
    blurb: "颜值·名气抬高脱单权重（示意趣味）。",
    kind: "life",
    adapt: { boostIds: ["yes"], by: ["appearance", "fame"], scale: 0.7 },
    options: withColors([
      {
        id: "yes",
        label: "脱单成功",
        weight: yes,
        effects: { mentality: 4, attitude: -1, appearance: 1 },
        flags: ["partner:yes"],
      },
      {
        id: "no",
        label: "专注事业",
        weight: 100 - yes,
        effects: { mentality: p.stats.mentality < 45 ? -2 : 0 },
        flags: ["partner:no"],
      },
    ]),
  };
}

export function buildMajorChain(p: PlayerState): RuntimeEvent[] {
  const major = majorForYear(p.year);
  const title = major.name.includes("Austin")
    ? "奥斯汀 Major 成绩"
    : major.name.includes("Shanghai")
      ? "上海 Major 成绩"
      : `${major.name} 成绩`;

  const result: RuntimeEvent = {
    id: "major_result",
    title,
    blurb: major.note,
    kind: "major",
    context: { majorName: major.name },
    adapt: {
      boostIds: ["final", "sf", "qf"],
      cutIds: ["mrq", "s1"],
      by: ["form", "aim", "sense", "mentality"],
      scale: 0.65,
    },
    options: withColors([
      {
        id: "final",
        label: "杀入决赛 → 对局链",
        weight: 8,
        enqueue: ["final_opponent", "map_bp", "half_hero", "half_teammate", "igl_read", "half_score"],
        flags: ["major_final"],
      },
      { id: "sf", label: "止步四强", weight: 14, flags: ["major_sf"], effects: { fame: 4, form: 2 } },
      { id: "qf", label: "止步八强", weight: 18, flags: ["major_qf"], effects: { fame: 2 } },
      { id: "s3", label: "止步 Stage 3", weight: 16, effects: { form: 1 } },
      { id: "s2", label: "止步 Stage 2", weight: 18 },
      { id: "s1", label: "止步 Stage 1", weight: 14, effects: { form: -1 } },
      {
        id: "mrq",
        label: "梦碎 MRQ",
        weight: 12,
        effects: { mentality: -4, form: -3, fame: -1 },
        flags: ["major_miss"],
      },
    ]),
  };
  return [result];
}

export function evtFinalOpponent(): RuntimeEvent {
  return {
    id: "final_opponent",
    title: "决赛面对的对手是",
    kind: "finals",
    options: withColors(
      FINAL_OPPONENTS.map((o) => ({
        id: o.id,
        label: o.label,
        weight: o.weight,
        flags: [`vs:${o.label}`],
      }))
    ),
  };
}

export function evtMapBp(): RuntimeEvent {
  return {
    id: "map_bp",
    title: "决赛地图 BP",
    blurb: "选出本场主地图；随后进入发挥与比分链（不再重复 enqueue）。",
    kind: "match",
    options: withColors(
      MAP_POOL.slice(0, 5).map((m) => ({
        id: m.id,
        label: m.label,
        weight: 1,
        flags: [`map:${m.label}`],
      }))
    ),
  };
}

export function evtHalfPerf(who: string, mapHint = "核子危机"): RuntimeEvent {
  const id = who === "hero" ? "half_hero" : "half_teammate";
  const role = who === "hero" ? "hero" : "mate";
  const title =
    who === "hero"
      ? `${mapHint} · 上半场 · 主角发挥`
      : `${mapHint} · 上半场 · 队友发挥`;
  return {
    id,
    title,
    kind: "match",
    adapt: {
      boostIds: ["S", "A"],
      cutIds: ["D", "C"],
      by: who === "hero" ? ["aim", "mentality", "form"] : ["sense", "leadership"],
      scale: 0.55,
    },
    options: withColors([
      { id: "S", label: formatPerfGrade("S", role), weight: 10, effects: { form: 4, fame: 2, clutch: 3 }, flags: [`perf:${who}:S`] },
      { id: "A", label: formatPerfGrade("A", role), weight: 18, effects: { form: 2, clutch: 1 }, flags: [`perf:${who}:A`] },
      { id: "B", label: formatPerfGrade("B", role), weight: 28, flags: [`perf:${who}:B`] },
      { id: "C", label: formatPerfGrade("C", role), weight: 24, effects: { form: -1 }, flags: [`perf:${who}:C`] },
      {
        id: "D",
        label: formatPerfGrade("D", role),
        weight: 20,
        effects: { form: -3, mentality: -2 },
        flags: [`perf:${who}:D`, "map1_bad"],
      },
    ]),
  };
}

export function evtIglRead(mapHint = "核子危机"): RuntimeEvent {
  return {
    id: "igl_read",
    title: `指挥对位 · ${mapHint}`,
    kind: "match",
    adapt: { boostIds: ["hero_read"], by: ["leadership", "sense"], scale: 0.5 },
    options: withColors([
      {
        id: "even",
        label: "旗鼓相当 (双方胜率不变)",
        weight: 40,
        flags: ["wr:0"],
      },
      {
        id: "hero_read",
        label: "主角解读对手 IGL (己方胜率 +30%)",
        weight: 30,
        effects: { leadership: 3, sense: 2 },
        flags: ["wr:+30"],
      },
      {
        id: "foe_read",
        label: "对手解读主角 (对方胜率 +30%)",
        weight: 30,
        effects: { leadership: -2, mentality: -1 },
        flags: ["wr:-30"],
      },
    ]),
  };
}

export function evtHalfScore(p: PlayerState): RuntimeEvent {
  const bias = p.ctx.winRateBias || 0;
  const badMap = p.history.some((h) => h.picked === "D" && h.label.includes("发挥"));
  // 心态高：图一崩了数值少掉（效果在 apply 时处理）；比分偏向别一边
  const crushThem = Math.max(4, 10 + bias * 0.15 + (p.judges.form - 50) * 0.2);
  const crushUs = Math.max(6, 18 - bias * 0.12 + (badMap ? 10 : 0));
  return {
    id: "half_score",
    title: `对局状况 · ${p.ctx.map || "核子危机"} · 上半场`,
    kind: "match",
    options: withColors([
      { id: "1_11", label: "1:11 一分父爱", weight: crushUs, flags: ["score:1-11"], effects: { mentality: -3, form: -2 } },
      { id: "11_1", label: "11:1 一分父爱", weight: crushThem, flags: ["score:11-1"], effects: { fame: 2, form: 3 } },
      { id: "10_2", label: "10:2 摧枯拉朽", weight: crushThem * 0.7, flags: ["score:10-2"], effects: { form: 2 } },
      { id: "9_3", label: "9:3 势如破竹", weight: 8, flags: ["score:9-3"] },
      { id: "8_4", label: "8:4 胜券在握", weight: 8, flags: ["score:8-4"] },
      { id: "7_5", label: "7:5 略占优势", weight: 10, flags: ["score:7-5"] },
      { id: "6_6", label: "6:6 势均力敌", weight: 12, flags: ["score:6-6"] },
      { id: "5_7", label: "5:7 难分高下", weight: 10, flags: ["score:5-7"] },
      { id: "4_8", label: "4:8 难掩颓势", weight: 8, flags: ["score:4-8"], effects: { mentality: -1 } },
      { id: "3_9", label: "3:9 背水一战", weight: 7, flags: ["score:3-9"], effects: { clutch: 2 } },
      { id: "2_10", label: "2:10 濒临绝境", weight: crushUs * 0.6, flags: ["score:2-10"], effects: { mentality: -2 } },
    ]),
  };
}

export function resolveTemplate(id: string, p: PlayerState): RuntimeEvent | null {
  switch (id) {
    case "worldline_shiro":
      return evtWorldlineShiro(p);
    case "team_pick":
    case "team_pick_cis": // 旧存档 enqueue 兼容
      return evtTeamPick(p.region);
    case "champ_count":
      return evtChampCount(p.year, p);
    case "transfer":
      return evtTransfer(p);
    case "reinforce_count":
      return evtReinforceCount();
    case "reinforce_who":
      return evtReinforceWho();
    case "girlfriend":
      return evtGirlfriend(p);
    case "final_opponent":
      return evtFinalOpponent();
    case "map_bp":
      return evtMapBp();
    case "half_hero":
      return evtHalfPerf("hero", p.ctx.map || "核子危机");
    case "half_teammate":
      return evtHalfPerf("mate", p.ctx.map || "核子危机");
    case "igl_read":
      return evtIglRead(p.ctx.map || "核子危机");
    case "half_score":
      return evtHalfScore(p);
    case "major_chain":
      return buildMajorChain(p)[0];
    default:
      return null;
  }
}

/** 赛年入口：按状态灵活拼装，非固定剧本 */
export function seedYearQueue(p: PlayerState): RuntimeEvent[] {
  const q: RuntimeEvent[] = [];
  const age = p.year - (p.debutYear || p.year);
  const formLow = p.judges.form < 45;
  const fameHigh = p.judges.fame >= 65;
  const cis =
    p.region === "独联体" || p.region === "cis" || p.country === "俄罗斯";

  if (cis && ((p.year + p.seed.length) % 3 === 0 || (fameHigh && age >= 2))) {
    q.push(evtWorldlineShiro(p));
  }
  q.push(evtChampCount(p.year, p));

  // 状态差或忠诚低：更易触发转会课题；忠诚极高可跳过
  if (p.judges.loyalty < 88 || formLow || (p.year + age) % 2 === 0) {
    q.push(evtTransfer(p));
  }

  q.push(...buildMajorChain(p));

  // 脱单：未婚且（偶数年 或 颜值/名气够高）
  if (!p.hasPartner && ((p.year + 1) % 2 === 0 || p.judges.appearance >= 70 || fameHigh)) {
    q.push(evtGirlfriend(p));
  }

  // 生涯中后期偶发补强讨论（未转会时也有）
  if (age >= 3 && formLow && Math.random() > 0.55) {
    q.push(evtReinforceCount());
  }

  return q;
}
