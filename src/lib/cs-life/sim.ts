import {
  BIRTH_ERA,
  COUNTRY_BY_REGION,
  GRADE_SCORE,
  MOTIVATION,
  REGION_OPTIONS,
  ROLE_CT,
  ROLE_T,
  SIX_LABELS,
  blankStats,
  debutYearOptions,
  gradeOptions,
  teamsForRegion,
} from "./catalog";
import {
  adaptOptions,
  blankJudges,
  customToRuntime,
  echoFromPick,
  resolveTemplate,
  seedYearQueue,
} from "./events";
import type {
  CustomEventDef,
  Grade,
  JudgeKey,
  PhaseId,
  PlayerState,
  RuntimeEvent,
  SixKey,
  StatDelta,
  WheelOption,
} from "./types";
import { withColors } from "./wheel";
import type { EchoBias } from "@/lib/life-sim/weighting";
import { riteForCs, shouldTriggerCsMidRite } from "@/lib/life-sim/rite";
import type { RiteBeat } from "@/lib/life-sim/rite";
import { humanizePick, regionKeyFromLabel } from "./format";

export function createPlayer(seed = `${Date.now()}`): PlayerState {
  return {
    seed,
    grades: {},
    stats: blankStats(),
    judges: blankJudges(),
    year: 0,
    majors: 0,
    majorWins: 0,
    trophiesYear: 0,
    bestHltvRank: null,
    ratingPeak: 0.95,
    hasPartner: false,
    events: [],
    queue: [],
    retired: false,
    history: [],
    ctx: {},
  };
}

export function phaseTitle(phase: PhaseId, p: PlayerState): string {
  if (phase === "event_spin" && p.queue[0]) return p.queue[0].title;
  switch (phase) {
    case "origin_region":
      return "出生地区";
    case "origin_country":
      return `所在国家 · ${p.region || "—"}`;
    case "birth_era":
      return "出生时期";
    case "debut_year":
      return "职业出道年份";
    case "team_pick":
      return `加盟战队 · ${p.region || "本区"}`;
    case "motivation":
      return "为何走上职业路";
    case "intl_squad":
      return "是否加入国际纵队";
    case "igl":
      return "是否担任指挥 (IGL)";
    case "role_ct":
      return "队内位置 · CT";
    case "role_t":
      return "队内位置 · T";
    case "grade_aim":
      return "初评 · 瞄准";
    case "grade_utility":
      return "初评 · 道具";
    case "grade_sense":
      return "初评 · 游戏理解";
    case "grade_attitude":
      return "初评 · 职业态度";
    case "grade_mentality":
      return "初评 · 心态";
    case "grade_appearance":
      return "初评 · 颜值";
    case "year_loop":
      return `${p.year} 赛季 · 日程`;
    case "season_recap":
      return `${p.year} 赛季 · 时间线总结`;
    case "summary":
      return "退役典礼";
    default:
      return phase;
  }
}

/** 开局进度：0～1，用于顶栏步骤条 */
export function originProgress(phase: PhaseId): number {
  const order: PhaseId[] = [
    "origin_region",
    "origin_country",
    "birth_era",
    "debut_year",
    "team_pick",
    "motivation",
    "intl_squad",
    "igl",
    "role_ct",
    "role_t",
    "grade_aim",
    "grade_utility",
    "grade_sense",
    "grade_attitude",
    "grade_mentality",
    "grade_appearance",
  ];
  const i = order.indexOf(phase);
  if (i < 0) return 1;
  return (i + 1) / order.length;
}

const GRADE_PHASES: { phase: PhaseId; key: SixKey }[] = [
  { phase: "grade_aim", key: "aim" },
  { phase: "grade_utility", key: "utility" },
  { phase: "grade_sense", key: "sense" },
  { phase: "grade_attitude", key: "attitude" },
  { phase: "grade_mentality", key: "mentality" },
];

export function nextPhase(current: PhaseId | null): PhaseId {
  const order: PhaseId[] = [
    "origin_region",
    "origin_country",
    "birth_era",
    "debut_year",
    "team_pick",
    "motivation",
    "intl_squad",
    "igl",
    "role_ct",
    "role_t",
    "grade_aim",
    "grade_utility",
    "grade_sense",
    "grade_attitude",
    "grade_mentality",
    "grade_appearance",
    "year_loop",
    "summary",
  ];
  if (!current) return order[0];
  const i = order.indexOf(current);
  return order[Math.min(i + 1, order.length - 1)];
}

function clamp(n: number, a = 1, b = 99) {
  return Math.max(a, Math.min(b, Math.round(n)));
}

function applyDelta(p: PlayerState, delta?: StatDelta) {
  if (!delta) return;
  for (const [k, v] of Object.entries(delta)) {
    if (v == null) continue;
    if (k in p.stats) {
      const key = k as SixKey;
      let dv = v;
      if (dv < 0 && p.stats.mentality >= 75) dv = Math.ceil(dv * 0.45);
      else if (dv < 0 && p.stats.mentality >= 60) dv = Math.ceil(dv * 0.7);
      p.stats[key] = clamp(p.stats[key] + dv);
    } else if (k in p.judges) {
      const key = k as JudgeKey;
      p.judges[key] = clamp(p.judges[key] + v);
    }
  }
}

function recomputeLeadership(p: PlayerState) {
  const base = p.stats.sense * 0.45 + p.stats.mentality * 0.25 + p.stats.attitude * 0.3;
  p.stats.leadership = clamp(base * 0.85 + (p.isIgl ? 12 : 0));
}

export function currentEvent(p: PlayerState): RuntimeEvent | null {
  return p.queue[0] || null;
}

export function optionsForPhase(
  phase: PhaseId,
  p: PlayerState,
  customs: CustomEventDef[] = [],
  echo?: EchoBias
): WheelOption[] {
  if (phase === "event_spin") {
    const ev = currentEvent(p);
    if (!ev) return withColors([{ id: "skip", label: "继续", weight: 1 }]);
    const live = resolveTemplate(ev.id, p) || ev;
    return adaptOptions(live, p, echo);
  }
  if (phase === "season_recap") {
    return withColors([
      { id: "next", label: "进入下一赛季", weight: 75 },
      { id: "retire", label: "宣布退役", weight: 25 },
    ]);
  }
  switch (phase) {
    case "origin_region":
      return REGION_OPTIONS;
    case "origin_country": {
      const list = COUNTRY_BY_REGION[regionKeyFromLabel(p.region)] || COUNTRY_BY_REGION.eu;
      return withColors(list);
    }
    case "birth_era":
      return BIRTH_ERA;
    case "debut_year":
      return debutYearOptions(p.birthEra || "00_05");
    case "team_pick":
      return teamsForRegion(regionKeyFromLabel(p.region));
    case "motivation":
      return MOTIVATION;
    case "intl_squad": {
      const stay = p.region === "独联体" || p.region === "欧洲" ? 72 : 55;
      return withColors([
        { id: "no", label: "留在本区阵容", weight: stay },
        { id: "yes", label: "加入国际纵队", weight: 100 - stay },
      ]);
    }
    case "igl": {
      const yes = Math.max(8, Math.min(45, 12 + (p.stats.sense - 50) * 0.35));
      return withColors([
        { id: "no", label: "不当指挥", weight: 100 - yes },
        { id: "yes", label: "担任 IGL", weight: yes },
      ]);
    }
    case "role_ct":
      return ROLE_CT;
    case "role_t":
      return ROLE_T;
    case "grade_aim":
    case "grade_utility":
    case "grade_sense":
    case "grade_attitude":
    case "grade_mentality": {
      const key = GRADE_PHASES.find((g) => g.phase === phase)!.key;
      return gradeOptions(key, 0);
    }
    case "grade_appearance":
      return gradeOptions("aim", 0).map((o, i) => {
        const labels = [
          "S+ (顶流脸)",
          "S (出道即巅峰)",
          "A (耐看)",
          "B (路人以上)",
          "C (普通)",
          "D (摄像头不友好)",
          "E (抽象滤镜)",
        ];
        return { ...o, label: labels[i] || o.label };
      });
    case "year_loop":
      return withColors([
        { id: "run_year", label: `推进 ${p.year} 赛季`, weight: 72 },
        { id: "insert_custom", label: "插入自定义事件", weight: 18 },
        { id: "retire", label: "退役并总结生涯", weight: 10 },
      ]);
    default:
      return withColors([{ id: "ok", label: "继续", weight: 1 }]);
  }
}

export function applyPick(
  phase: PhaseId,
  p: PlayerState,
  opt: WheelOption,
  customs: CustomEventDef[] = []
): { player: PlayerState; next: PhaseId; subResult?: string; rite?: RiteBeat; echo?: EchoBias } {
  const player: PlayerState = {
    ...p,
    stats: { ...p.stats },
    judges: { ...p.judges },
    events: [...p.events],
    queue: [...p.queue],
    history: [...p.history],
    ctx: { ...p.ctx },
    grades: { ...p.grades },
  };

  let next: PhaseId = nextPhase(phase);
  let subResult: string | undefined = opt.label;

  if (phase === "event_spin") {
    return applyEventSpin(player, opt, customs);
  }

  if (phase === "season_recap") {
    player.history.push({ phase, label: phaseTitle(phase, p), picked: opt.label });
    if (opt.id === "retire") {
      player.retired = true;
      return {
        player,
        next: "summary",
        subResult: "宣布退役",
        rite: riteForCs(player, false),
      };
    }
    const age = player.year - (player.debutYear || player.year);
    if (age >= 10) {
      player.retired = true;
      return {
        player,
        next: "summary",
        subResult: "生涯年限到头",
        rite: riteForCs(player, false),
      };
    }
    player.year += 1;
    player.ctx = {};
    const rite = shouldTriggerCsMidRite(player) ? riteForCs(player, true) : undefined;
    return { player, next: "year_loop", subResult: `${player.year} 赛季开启`, rite };
  }

  player.history.push({ phase, label: phaseTitle(phase, p), picked: opt.label });

  switch (phase) {
    case "origin_region":
      player.region = opt.label;
      break;
    case "origin_country":
      player.country = opt.label;
      break;
    case "birth_era":
      player.birthEra = opt.id;
      break;
    case "debut_year": {
      const y = Number(opt.id) || Number(String(opt.label).replace(/\D/g, ""));
      player.debutYear = y;
      player.year = y;
      // 故意不设 team —— 下一环 team_pick 才选
      break;
    }
    case "team_pick":
      player.team = opt.label;
      player.events.push({
        year: player.year || player.debutYear || 0,
        title: "加盟战队",
        detail: `正式签约 ${opt.label}`,
        kind: "team",
      });
      // 若已完成开局评定（中途补选战队），直接回赛季；否则继续开局链
      if (player.grades.aim != null || player.grades.mentality != null) {
        next = "year_loop";
      }
      break;
    case "motivation":
      player.motivation = opt.label;
      break;
    case "intl_squad":
      player.intlSquad = opt.id === "yes";
      break;
    case "igl":
      player.isIgl = opt.id === "yes";
      recomputeLeadership(player);
      break;
    case "role_ct":
      player.roleCt = opt.id;
      break;
    case "role_t":
      player.roleT = opt.id;
      break;
    case "grade_aim":
    case "grade_utility":
    case "grade_sense":
    case "grade_attitude":
    case "grade_mentality": {
      const key = GRADE_PHASES.find((g) => g.phase === phase)!.key;
      const grade = opt.id as Grade;
      player.grades[key] = grade;
      player.stats[key] = GRADE_SCORE[grade];
      recomputeLeadership(player);
      break;
    }
    case "grade_appearance": {
      const grade = opt.id as Grade;
      player.grades.appearance = grade;
      player.judges.appearance = GRADE_SCORE[grade];
      player.events.push({
        year: player.year,
        title: "初登职业",
        detail: [
          player.team ? `效力 ${player.team}` : "战队待定",
          player.country || "",
          player.isIgl ? "IGL" : "",
          `颜值 ${opt.label}`,
        ]
          .filter(Boolean)
          .join(" · "),
        kind: "life",
      });
      next = "year_loop";
      break;
    }
    case "year_loop": {
      if (opt.id === "retire") {
        player.retired = true;
        next = "summary";
        return {
          player,
          next,
          subResult: "退役结算",
          rite: riteForCs(player, false),
        };
      }
      if (opt.id === "insert_custom") {
        next = "year_loop";
        subResult = "请在下方编辑器插入自定义事件";
        break;
      }
      if (!player.team) {
        next = "team_pick";
        subResult = "请先选择效力战队";
        break;
      }
      player.trophiesYear = 0;
      player.queue = seedYearQueue(player);
      next = player.queue.length ? "event_spin" : "season_recap";
      break;
    }
    default:
      break;
  }

  return { player, next, subResult };
}

function applyEventSpin(
  player: PlayerState,
  opt: WheelOption,
  customs: CustomEventDef[]
): { player: PlayerState; next: PhaseId; subResult?: string; rite?: RiteBeat; echo?: EchoBias } {
  const head = player.queue[0];
  if (!head) {
    return { player, next: "season_recap", subResult: "本赛季事件已空" };
  }

  const detail = humanizePick(head.id, opt.id, opt.label);
  player.history.push({ phase: "event_spin", label: head.title, picked: detail });
  applyDelta(player, opt.effects);

  for (const f of opt.flags || []) {
    if (f.startsWith("join:")) player.team = f.slice(5);
    if (f.startsWith("vs:")) player.ctx.opponent = f.slice(3);
    if (f.startsWith("map:")) player.ctx.map = f.slice(4);
    if (f.startsWith("trophies:")) {
      player.trophiesYear = Number(f.slice(9)) || 0;
    }
    if (f === "partner:yes") player.hasPartner = true;
    if (f === "partner:no") player.hasPartner = false;
    if (f === "major_final" || f === "major_sf" || f === "major_qf") player.majors += 1;
    if (f === "wr:+30") player.ctx.winRateBias = (player.ctx.winRateBias || 0) + 30;
    if (f === "wr:-30") player.ctx.winRateBias = (player.ctx.winRateBias || 0) - 30;
    if (f === "wr:0") player.ctx.winRateBias = player.ctx.winRateBias || 0;
  }

  if (head.id === "champ_count" && player.trophiesYear > 0) {
    applyDelta(player, { fame: player.trophiesYear * 2, form: player.trophiesYear });
  }

  if (head.id === "half_score") {
    const crush = /11:1|10:2|9:3/.test(opt.label);
    const lost = /1:11|2:10|3:9/.test(opt.label);
    if (crush && (player.ctx.winRateBias || 0) >= 0) {
      player.majorWins += 1;
      applyDelta(player, { fame: 8, mentality: 3, form: 4, clutch: 3 });
      player.events.push({
        year: player.year,
        title: "Major 冠军",
        detail: `${player.ctx.map || "地图"} 上半场 ${opt.label}；对阵 ${player.ctx.opponent || "?"} `,
        kind: "major",
      });
    } else if (lost) {
      applyDelta(player, {
        mentality: player.stats.mentality >= 70 ? -1 : -4,
        form: player.stats.mentality >= 70 ? -1 : -3,
      });
      player.events.push({
        year: player.year,
        title: "大赛受挫",
        detail: `${opt.label} · ${player.stats.mentality >= 70 ? "心态抗压减伤" : "心态下滑"}`,
        kind: "match",
      });
    } else {
      player.events.push({
        year: player.year,
        title: head.title,
        detail,
        kind: head.kind || "match",
      });
    }
  } else if (head.id === "team_pick" || head.id === "team_pick_cis") {
    player.events.push({
      year: player.year,
      title: "加盟 / 转会落定",
      detail: `效力 ${opt.label}`,
      kind: "team",
    });
  } else {
    player.events.push({
      year: player.year,
      title: head.title,
      detail,
      kind: head.kind || "custom",
    });
  }

  recomputeLeadership(player);

  player.queue.shift();
  const children: RuntimeEvent[] = [];
  for (const id of opt.enqueue || []) {
    const custom = customs.find((c) => c.id === id);
    if (custom) children.push(customToRuntime(custom));
    else {
      const tpl = resolveTemplate(id, player);
      if (tpl) children.push(tpl);
    }
  }
  player.queue = [...children, ...player.queue];

  const echo = echoFromPick(opt.id, opt.label);

  if (player.queue.length) {
    return { player, next: "event_spin", subResult: detail, echo };
  }

  // 赛季事件跑完 → 时间线总结（先不涨年）
  return { player, next: "season_recap", subResult: detail, echo };
}

export function insertCustomIntoQueue(p: PlayerState, def: CustomEventDef): PlayerState {
  return {
    ...p,
    queue: [customToRuntime(def), ...p.queue],
  };
}

export function eventsForYear(p: PlayerState, year: number) {
  return p.events.filter((e) => e.year === year);
}

export function summaryText(p: PlayerState): string {
  const rite = riteForCs(p, false);
  const dims = (Object.keys(SIX_LABELS) as SixKey[])
    .map((k) => `${SIX_LABELS[k]}${Math.round(p.stats[k])}`)
    .join(" · ");
  return [
    `【${rite.stage}】${rite.epithet}`,
    rite.verse,
    `${p.country || "?"} · ${p.team || "无战队"}`,
    `出道 ${p.debutYear || "?"} → ${p.retired ? `退役 ${p.year}` : `${p.year} 赛季`}`,
    `Major 出场 ${p.majors} · 冠军 ${p.majorWins}`,
    `六维：${dims}`,
    `判定：颜值${p.judges.appearance} 忠诚${p.judges.loyalty} 名气${p.judges.fame} 状态${p.judges.form} 残局${p.judges.clutch}`,
    `恋爱：${p.hasPartner ? "稳定脱单" : "专注事业"} · IGL：${p.isIgl ? "是" : "否"}`,
    `动机：${p.motivation || "—"}`,
  ].join("\n");
}
