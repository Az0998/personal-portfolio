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
  SixStats,
  StatDelta,
  WheelOption,
} from "./types";
import { pickWeighted, withColors } from "./wheel";
import type { EchoBias } from "@/lib/life-sim/weighting";
import { riteForCs, shouldTriggerCsMidRite } from "@/lib/life-sim/rite";
import type { RiteBeat } from "@/lib/life-sim/rite";

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
      return "出生地点";
    case "origin_country":
      return `所在国家 · ${p.region || "—"}`;
    case "birth_era":
      return "出生时期";
    case "debut_year":
      return "加入职业战队时间";
    case "motivation":
      return "为何成为职业选手";
    case "intl_squad":
      return `是否加入国际纵队（${p.region === "独联体" || p.region === "cis" ? "独联体" : p.region || "本区"}）`;
    case "igl":
      return "是否担任指挥";
    case "role_ct":
      return "队内位置 (CT)";
    case "role_t":
      return "队内位置 (T)";
    case "grade_aim":
      return "瞄准能力 · 初登场";
    case "grade_utility":
      return "道具能力 · 初登场";
    case "grade_sense":
      return "游戏理解 · 初登场";
    case "grade_attitude":
      return "职业态度";
    case "grade_mentality":
      return "心态";
    case "grade_appearance":
      return "颜值 · 初登场";
    case "year_loop":
      return `${p.year} 赛季 · 日程`;
    case "summary":
      return "生涯结算";
    default:
      return phase;
  }
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
      // 心态高：负面掉分打折（图一崩了少掉）
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

function enqueueIds(p: PlayerState, ids: string[] | undefined, customs: CustomEventDef[]) {
  if (!ids?.length) return;
  for (const id of ids) {
    const custom = customs.find((c) => c.id === id);
    if (custom) {
      p.queue.push(customToRuntime(custom));
      continue;
    }
    const tpl = resolveTemplate(id, p);
    if (tpl) p.queue.push(tpl);
  }
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
    // refresh adaptive templates that depend on ctx
    const live = resolveTemplate(ev.id, p) || ev;
    return adaptOptions(live, p, echo);
  }
  switch (phase) {
    case "origin_region":
      return REGION_OPTIONS;
    case "origin_country": {
      const list = COUNTRY_BY_REGION[mapRegionId(p.region)] || COUNTRY_BY_REGION.eu;
      return withColors(list);
    }
    case "birth_era":
      return BIRTH_ERA;
    case "debut_year":
      return debutYearOptions(p.birthEra || "00_05");
    case "motivation":
      return MOTIVATION;
    case "intl_squad": {
      const stay = p.region === "独联体" || p.region === "cis" || p.region === "欧洲" ? 72 : 55;
      return withColors([
        { id: "no", label: "否", weight: stay },
        { id: "yes", label: "是", weight: 100 - stay },
      ]);
    }
    case "igl": {
      const yes = Math.max(8, Math.min(45, 12 + (p.stats.sense - 50) * 0.35));
      return withColors([
        { id: "no", label: "否", weight: 100 - yes },
        { id: "yes", label: "是", weight: yes },
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
        { id: "run_year", label: "推进本赛季事件链", weight: 70 },
        { id: "insert_custom", label: "先插入自定义事件", weight: 20 },
        { id: "retire", label: "退役结算", weight: 10 },
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
    case "debut_year":
      player.debutYear = Number(opt.label);
      player.year = Number(opt.label);
      player.team = pickWeighted(teamsForRegion(mapRegionId(player.region))).label;
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
        detail: `加盟 ${player.team} · ${player.country} · ${player.isIgl ? "IGL · " : ""}${opt.label}`,
        kind: "life",
      });
      next = "year_loop";
      break;
    }
    case "year_loop": {
      if (opt.id === "retire") {
        player.retired = true;
        next = "summary";
        break;
      }
      if (opt.id === "insert_custom") {
        next = "year_loop";
        subResult = "请在下方编辑器插入自定义事件";
        break;
      }
      // run year chain
      player.trophiesYear = 0;
      player.queue = seedYearQueue(player);
      next = player.queue.length ? "event_spin" : "year_loop";
      if (!player.queue.length) player.year += 1;
      break;
    }
    default:
      break;
  }

  return { player, next, subResult };
}

function mapRegionId(label?: string) {
  const m: Record<string, string> = {
    独联体: "cis",
    欧洲: "eu",
    北美: "na",
    南美: "sa",
    亚洲: "asia",
    大洋洲: "oce",
  };
  return m[label || ""] || "eu";
}

function applyEventSpin(
  player: PlayerState,
  opt: WheelOption,
  customs: CustomEventDef[]
): { player: PlayerState; next: PhaseId; subResult?: string; rite?: RiteBeat; echo?: EchoBias } {
  const head = player.queue[0];
  if (!head) {
    return { player, next: "year_loop", subResult: "队列空" };
  }

  // use adapted option metadata from pick (effects/flags/enqueue on opt)
  player.history.push({ phase: "event_spin", label: head.title, picked: opt.label });
  applyDelta(player, opt.effects);

  // flags
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

  // championship from champ_count → fame
  if (head.id === "champ_count" && player.trophiesYear > 0) {
    applyDelta(player, { fame: player.trophiesYear * 2, form: player.trophiesYear });
  }

  // major final win heuristic after half_score
  if (head.id === "half_score") {
    const crush = /11:1|10:2|9:3/.test(opt.label);
    const lost = /1:11|2:10|3:9/.test(opt.label);
    if (crush && (player.ctx.winRateBias || 0) >= 0) {
      player.majorWins += 1;
      applyDelta(player, { fame: 8, mentality: 3, form: 4, clutch: 3 });
      player.events.push({
        year: player.year,
        title: "Major 冠军（示意）",
        detail: `${player.ctx.map || "地图"} 上半场 ${opt.label}；对阵 ${player.ctx.opponent || "?"}；链路夺冠结算`,
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
        detail: `${opt.label} · 心态${player.stats.mentality >= 70 ? "抗压减伤" : "下滑"}`,
        kind: "match",
      });
    } else {
      player.events.push({
        year: player.year,
        title: head.title,
        detail: opt.label,
        kind: head.kind || "match",
      });
    }
  } else {
    player.events.push({
      year: player.year,
      title: head.title,
      detail: opt.label,
      kind: head.kind || "custom",
    });
  }

  if (opt.flags?.includes("did_transfer") || head.id === "team_pick_cis") {
    // team already set via join
  }

  recomputeLeadership(player);

  // pop current, enqueue children at front (depth-first story)
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
    return { player, next: "event_spin", subResult: opt.label, echo };
  }

  // year complete
  const age = player.year - (player.debutYear || player.year);
  if (age >= 11 || player.retired) {
    player.retired = true;
    return {
      player,
      next: "summary",
      subResult: opt.label,
      rite: riteForCs(player, false),
      echo,
    };
  }
  player.year += 1;
  player.ctx = {};
  const rite = shouldTriggerCsMidRite(player) ? riteForCs(player, true) : undefined;
  return { player, next: "year_loop", subResult: opt.label, rite, echo };
}

export function insertCustomIntoQueue(p: PlayerState, def: CustomEventDef): PlayerState {
  return {
    ...p,
    queue: [customToRuntime(def), ...p.queue],
  };
}

export function summaryText(p: PlayerState): string {
  const rite = riteForCs(p, false);
  const dims = (Object.keys(SIX_LABELS) as SixKey[])
    .map((k) => `${SIX_LABELS[k]}${Math.round(p.stats[k])}`)
    .join(" · ");
  return [
    `【${rite.stage}】${rite.epithet}`,
    rite.verse,
    `${p.country || "?"} · ${p.team || "?"}`,
    `出道 ${p.debutYear || "?"} → ${p.retired ? `退役 ${p.year}` : `${p.year} 赛季`}`,
    `Major ${p.majors} · 冠 ${p.majorWins} · 最佳排名 ${p.bestHltvRank ?? "—"} · 峰值 ${p.ratingPeak.toFixed(2)}`,
    `六维：${dims}`,
    `判定维：颜值${p.judges.appearance} 忠诚${p.judges.loyalty} 名气${p.judges.fame} 状态${p.judges.form} 残局${p.judges.clutch}`,
    `恋爱：${p.hasPartner ? "稳定脱单" : "专注事业"} · IGL：${p.isIgl ? "是" : "否"}`,
    `动机：${p.motivation || "—"}`,
  ].join("\n");
}
