import type { DomainMeta, LifeRun } from "./types";
import type { PlayerState } from "@/lib/cs-life/types";
import { SIX_LABELS } from "@/lib/cs-life/catalog";
import type { SixKey } from "@/lib/cs-life/types";

export type RiteBeat = {
  /** 阶段名，如「弱冠」「而立」「赛季中场」 */
  stage: string;
  /** 称号 / 墓志铭一行 */
  epithet: string;
  /** 短赋 */
  verse: string;
  /** 关键属性句 */
  seals: string[];
};

const MORTAL_STAGES: { age: number; stage: string }[] = [
  { age: 6, stage: "童蒙初启" },
  { age: 18, stage: "弱冠之年" },
  { age: 30, stage: "而立之年" },
  { age: 40, stage: "不惑之年" },
  { age: 50, stage: "知命之年" },
  { age: 60, stage: "耳顺之年" },
  { age: 80, stage: "耄耋回望" },
];

const HYDRO_STAGES: { age: number; stage: string }[] = [
  { age: 24, stage: "入行开卷" },
  { age: 28, stage: "项目立身" },
  { age: 35, stage: "中流砥柱" },
  { age: 45, stage: "传灯之年" },
  { age: 55, stage: "河图落定" },
];

export function mortalStageAt(age: number): string | null {
  return MORTAL_STAGES.find((s) => s.age === age)?.stage ?? null;
}

export function hydroStageAt(age: number): string | null {
  return HYDRO_STAGES.find((s) => s.age === age)?.stage ?? null;
}

function topStats(stats: Record<string, number>, labels: { key: string; label: string }[], n = 2) {
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => {
      const lab = labels.find((x) => x.key === k)?.label || k;
      return `${lab}${Math.round(v)}`;
    });
}

function mortalEpithet(run: LifeRun): string {
  const f = run.flags;
  if (f.includes("peaceful") && f.includes("memoir")) return "河清海晏 · 笔下生平";
  if (f.includes("uni_top") && f.includes("corp")) return "青衿入海 · 码农登舟";
  if (f.includes("civil")) return "一纸编制 · 半生安稳";
  if (f.includes("startup_seed") || f.includes("lucky")) return "赌徒与诗人之间";
  if (f.includes("contest_gold")) return "少年折桂 · 余韵未散";
  if (f.includes("first_love") && f.includes("married")) return "情字一笔 · 白首约成";
  if (f.includes("mini_viral") || f.includes("creator")) return "算法偶然 · 你认真接住";
  if (f.includes("pet")) return "多了一双眼睛的日子";
  if (f.includes("took_leap")) return "赴约的人有风";
  if (f.includes("crisis") && (run.stats.spr ?? 0) >= 60) return "中年破浪 · 心灯未灭";
  if ((run.stats.iq ?? 0) >= 80) return "慧根不浅 · 人间一场";
  if ((run.stats.chr ?? 0) >= 75) return "风度翩翩 · 路过人间";
  return "凡人一梦 · 转盘为证";
}

function hydroEpithet(run: LifeRun): string {
  const f = run.flags;
  if (f.includes("flood_hero")) return "汛夜执灯 · 报得一江安";
  if (f.includes("report_ace") && f.includes("pm")) return "论证成碑 · 项目为剑";
  if (f.includes("xaj_nerd")) return "新安江里 · 参数成魔";
  if (f.includes("portfolio_hit") || f.includes("oss")) return "业余作品 · 意外出圈";
  if (f.includes("expert")) return "领域识途 · 后学问津";
  if (f.includes("quiet_life")) return "测站清茶 · 水调歌头";
  if (f.includes("prod_incident")) return "回滚之后 · 更懂敬畏";
  return "水信息人 · 一行脚印";
}

function nightEpithet(run: LifeRun): string {
  const f = run.flags;
  if (f.includes("wrote_book")) return "把夜晚订成册";
  if (f.includes("night_keeper")) return "城市的编外守夜人";
  if (f.includes("sleep_peace")) return "终于与黎明握手";
  if (f.includes("rooftop_friend")) return "天台上的共犯";
  if (f.includes("cat_ally")) return "关东煮与流浪猫同盟";
  if ((run.stats.soft ?? 0) >= 75) return "锋芒收进外套内侧";
  return "灯火里的过路人";
}

export function riteForLifeRun(run: LifeRun, meta: DomainMeta, final = false): RiteBeat {
  const stage =
    (run.domainId === "mortal"
      ? mortalStageAt(run.age)
      : run.domainId === "hydro"
        ? hydroStageAt(run.age)
        : nightStageAt(run.age)) ||
    (final ? "生涯落定" : `${run.age} 岁节点`);
  const epithet =
    run.domainId === "hydro"
      ? hydroEpithet(run)
      : run.domainId === "night"
        ? nightEpithet(run)
        : mortalEpithet(run);
  const seals = [
    ...topStats(run.stats, meta.stats, 3),
    run.flags.slice(-3).join(" · ") || "尚无印记",
  ];
  const verse = final
    ? `转盘停处，尘埃落定。称号「${epithet}」。这不是最优解，却是你转出的那条河。`
    : `行至${stage}，风物略记：${seals[0]}，旗标隐现。命运尚未盖棺，且听下回分解。`;
  return { stage, epithet, verse, seals };
}

/** CS 生涯仪式总结 */
export function riteForCs(p: PlayerState, mid = false): RiteBeat {
  const years = Math.max(0, (p.year || 0) - (p.debutYear || p.year || 0));
  const stage = mid
    ? years < 3
      ? "新秀赛季"
      : years < 7
        ? "当打之年"
        : "传奇尾声"
    : "退役典礼";

  let epithet = "枪口之下 · 普通选手";
  const viral = p.events.some((e) => /热搜|名场面|病毒|viral|见面会/i.test(e.title + e.detail));
  const mvp = p.events.some((e) => /MVP|捧起赛事/i.test(e.detail));
  if (p.majorWins >= 2) epithet = "大满贯侧影 · 奖杯刻名";
  else if (mvp) epithet = "聚光灯认出了你的准星";
  else if (p.majorWins >= 1) epithet = "一度加冕 · 余生回味";
  else if (p.majors >= 4) epithet = "常客八强 · 未竟决赛";
  else if (viral) epithet = "梗比子弹飞得远";
  else if (p.judges.fame >= 75) epithet = "流量与枪法 · 双线并行";
  else if (p.isIgl && p.stats.leadership >= 70) epithet = "耳机里的皇帝";
  else if (p.judges.loyalty >= 80) epithet = "一队忠犬 · 少有离歌";
  else if (p.hasPartner && p.judges.appearance >= 70) epithet = "赛场内外 · 皆有观众";

  const dims = (Object.keys(SIX_LABELS) as SixKey[])
    .map((k) => `${SIX_LABELS[k]}${Math.round(p.stats[k])}`)
    .slice(0, 3);

  const seals = [
    `${p.country || "?"} · ${p.team || "?"}`,
    `Major ${p.majors} / 冠 ${p.majorWins}`,
    ...dims,
  ];

  const verse = mid
    ? `${stage}小憩。称号暂拟「${epithet}」。转盘还在转，故事未完。`
    : `聚光灯落下。自 ${p.debutYear || "?"} 至 ${p.year}，${p.country || "无名之地"} 走出的选手，被记作「${epithet}」。这不是 HLTV 排名，是你转出来的碑文。`;

  return { stage, epithet, verse, seals };
}

const NIGHT_STAGES: { age: number; stage: string }[] = [
  { age: 22, stage: "夜色初浓" },
  { age: 30, stage: "城市中场" },
  { age: 40, stage: "灯火知己" },
  { age: 50, stage: "黎明和解" },
];

export function nightStageAt(age: number): string | null {
  return NIGHT_STAGES.find((s) => s.age === age)?.stage ?? null;
}

export function shouldTriggerLifeRite(run: LifeRun): boolean {
  if (run.domainId === "mortal") return mortalStageAt(run.age) != null;
  if (run.domainId === "hydro") return hydroStageAt(run.age) != null;
  if (run.domainId === "night") return nightStageAt(run.age) != null;
  return false;
}

export function shouldTriggerCsMidRite(p: PlayerState): boolean {
  const years = (p.year || 0) - (p.debutYear || 0);
  return years > 0 && years % 3 === 0 && !p.retired;
}
