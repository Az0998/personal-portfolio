/**
 * CS 叙事支线库 —— 媒体 / 赞助 / 阵容化学 / 训练营 / 荒诞趣味
 * 文案偏「短篇小说选项」，权重仍走自适应引擎。
 */
import type { PlayerState, RuntimeEvent, StatDelta } from "./types";
import { withColors } from "./wheel";

function mood(p: PlayerState) {
  return (p.stats.mentality + p.judges.form + p.judges.fame) / 3;
}

/** 训练营地狱周 */
export function evtBootcamp(p: PlayerState): RuntimeEvent {
  return {
    id: "bootcamp",
    title: `${p.year} · 封闭训练营`,
    blurb: "教练把日程表贴满墙。窗外是春天，室内是 demo。",
    kind: "form",
    adapt: { boostIds: ["ascend", "clutch_lab"], cutIds: ["slack"], by: ["attitude", "mentality"], scale: 0.55 },
    options: withColors([
      {
        id: "ascend",
        label: "把枪感磨成刀锋",
        weight: 16,
        effects: { aim: 5, form: 4, mentality: -2, attitude: 2 } as StatDelta,
        flags: ["bootcamp_ace"],
      },
      {
        id: "clutch_lab",
        label: "专练残局实验室",
        weight: 18,
        effects: { clutch: 6, sense: 2, form: 2 } as StatDelta,
      },
      {
        id: "theory",
        label: "把战术本写满批注",
        weight: 22,
        effects: { sense: 4, leadership: 3, aim: -1 } as StatDelta,
      },
      {
        id: "slack",
        label: "偷偷开一局娱乐",
        weight: 20,
        effects: { mentality: 3, form: -3, attitude: -2 } as StatDelta,
        flags: ["caught_slacking"],
      },
      {
        id: "injury",
        label: "手腕隐隐作痛仍硬撑",
        weight: 14,
        effects: { form: -4, attitude: 3, mentality: -1 } as StatDelta,
        flags: ["wrist_warn"],
        enqueue: ["physio"],
      },
      {
        id: "bond",
        label: "夜宵局把队伍聊热了",
        weight: 10,
        effects: { loyalty: 4, mentality: 3, leadership: 1 } as StatDelta,
        flags: ["roster_chemistry"],
      },
    ]),
  };
}

export function evtPhysio(): RuntimeEvent {
  return {
    id: "physio",
    title: "队医谈话",
    blurb: "他指着核磁片子，像指着一张未拆的炸弹。",
    kind: "life",
    options: withColors([
      {
        id: "rest",
        label: "听话休息两周",
        weight: 40,
        effects: { form: 3, mentality: 2, fame: -1 } as StatDelta,
        flags: ["rested"],
      },
      {
        id: "painkill",
        label: "贴着膏药上场",
        weight: 35,
        effects: { form: -2, attitude: 2, clutch: 1 } as StatDelta,
        flags: ["playing_hurt"],
      },
      {
        id: "ignore",
        label: "「我感觉还行」",
        weight: 25,
        effects: { form: -5, mentality: -2 } as StatDelta,
        flags: ["ignore_injury"],
      },
    ]),
  };
}

/** 赛后采访 */
export function evtMedia(p: PlayerState): RuntimeEvent {
  const hot = p.judges.fame >= 60;
  return {
    id: "media",
    title: "混合区话筒伸过来",
    blurb: hot ? "闪光灯比你的准星还密。" : "只有两支镜头，像两只好奇的猫。",
    kind: "life",
    adapt: { boostIds: ["humble", "fire"], cutIds: ["tilt_mic"], by: ["mentality", "fame", "appearance"], scale: 0.45 },
    options: withColors([
      {
        id: "humble",
        label: "「队伍赢的，我只是螺丝钉」",
        weight: 28,
        effects: { fame: 2, loyalty: 2, mentality: 1 } as StatDelta,
        flags: ["pr_good"],
      },
      {
        id: "fire",
        label: "放狠话：下一场见真章",
        weight: 18,
        effects: { fame: 5, mentality: 2, loyalty: -1 } as StatDelta,
        flags: ["trash_talk"],
        enqueue: ["rival_reply"],
      },
      {
        id: "tilt_mic",
        label: "当场红温怼记者",
        weight: 14,
        effects: { fame: 3, mentality: -6, attitude: -3 } as StatDelta,
        flags: ["pr_disaster"],
      },
      {
        id: "mute",
        label: "戴着耳机说「no comment」",
        weight: 22,
        effects: { fame: -1, mentality: 1 } as StatDelta,
      },
      {
        id: "meme",
        label: "甩出一句抽象名场面",
        weight: 18,
        effects: { fame: 6, appearance: 2, mentality: 2 } as StatDelta,
        flags: ["went_viral"],
      },
    ]),
  };
}

export function evtRivalReply(): RuntimeEvent {
  return {
    id: "rival_reply",
    title: "对手在社媒回踩",
    blurb: "评论区已变成战场，裁判是点赞数。",
    kind: "worldline",
    options: withColors([
      {
        id: "laugh",
        label: "回一个微笑表情",
        weight: 35,
        effects: { mentality: 3, fame: 2 } as StatDelta,
      },
      {
        id: "fuel",
        label: "加柴：赛场见真章",
        weight: 30,
        effects: { form: 2, fame: 3, mentality: -1 } as StatDelta,
        flags: ["blood_feud"],
      },
      {
        id: "manager",
        label: "让经理去灭火",
        weight: 35,
        effects: { fame: -1, loyalty: 1, mentality: 1 } as StatDelta,
      },
    ]),
  };
}

/** 赞助合同 */
export function evtSponsor(p: PlayerState): RuntimeEvent {
  const pull = Math.max(10, p.judges.fame * 0.5 + p.judges.appearance * 0.3);
  return {
    id: "sponsor",
    title: "品牌方递来合同",
    blurb: "封面是你的侧脸，条款是别人的算术。",
    kind: "life",
    adapt: { boostIds: ["sign_big"], cutIds: ["refuse"], by: ["fame", "appearance"], scale: 0.5 },
    options: withColors([
      {
        id: "sign_big",
        label: "签下顶配代言",
        weight: pull * 0.35,
        effects: { fame: 6, mentality: 2, attitude: -1 } as StatDelta,
        flags: ["sponsor_big"],
      },
      {
        id: "sign_ok",
        label: "签个稳妥周边联名",
        weight: 28,
        effects: { fame: 3, mentality: 1 } as StatDelta,
        flags: ["sponsor_ok"],
      },
      {
        id: "refuse",
        label: "拒签：怕分心",
        weight: 22,
        effects: { attitude: 3, fame: -2, mentality: 1 } as StatDelta,
        flags: ["sponsor_no"],
      },
      {
        id: "bad_deal",
        label: "被忽悠签了坑条款",
        weight: 16,
        effects: { fame: 2, mentality: -4, loyalty: -2 } as StatDelta,
        flags: ["sponsor_trap"],
      },
    ]),
  };
}

/** 队内化学 */
export function evtChemistry(p: PlayerState): RuntimeEvent {
  return {
    id: "chemistry",
    title: `更衣室气流 · ${p.team || "本队"}`,
    blurb: "有人把耳机音量开到最大，有人把沉默开到最大。",
    kind: "team",
    adapt: { boostIds: ["glue"], cutIds: ["explode"], by: ["leadership", "loyalty", "mentality"], scale: 0.5 },
    options: withColors([
      {
        id: "glue",
        label: "你把矛盾按成团队笑话",
        weight: 22,
        effects: { loyalty: 5, leadership: 3, mentality: 2 } as StatDelta,
        flags: ["roster_chemistry"],
      },
      {
        id: "side",
        label: "站队，站得毫不掩饰",
        weight: 20,
        effects: { loyalty: -4, fame: 1, mentality: -2 } as StatDelta,
        flags: ["took_sides"],
      },
      {
        id: "explode",
        label: "训练赛当场掀桌",
        weight: 14,
        effects: { form: -5, mentality: -5, leadership: -3 } as StatDelta,
        flags: ["locker_blowup"],
        enqueue: ["coach_talk"],
      },
      {
        id: "quiet",
        label: "戴上耳机，假装听不见",
        weight: 26,
        effects: { mentality: -1 } as StatDelta,
      },
      {
        id: "lead",
        label: "拉全队开复盘会",
        weight: 18,
        effects: { leadership: 4, sense: 2, attitude: 2 } as StatDelta,
        flags: ["called_meeting"],
      },
    ]),
  };
}

export function evtCoachTalk(): RuntimeEvent {
  return {
    id: "coach_talk",
    title: "教练关上门",
    blurb: "门板很薄，他的眼神很厚。",
    kind: "team",
    options: withColors([
      {
        id: "accept",
        label: "认错，明天加倍练",
        weight: 40,
        effects: { attitude: 4, mentality: 2, loyalty: 2 } as StatDelta,
      },
      {
        id: "argue",
        label: "据理力争自己的阅读",
        weight: 30,
        effects: { leadership: 2, loyalty: -3, mentality: -1 } as StatDelta,
      },
      {
        id: "bench",
        label: "被按上替补席一周",
        weight: 30,
        effects: { form: -3, fame: -2, mentality: -4 } as StatDelta,
        flags: ["benched"],
      },
    ]),
  };
}

/** 线上段位荒诞夜 */
export function evtRankedNight(p: PlayerState): RuntimeEvent {
  return {
    id: "ranked_night",
    title: "休赛日 · 匿名上分夜",
    blurb: "ID 是乱码，心态是真实的。",
    kind: "form",
    adapt: { boostIds: ["godrun"], cutIds: ["tilt_queue"], by: ["aim", "mentality"], scale: 0.5 },
    options: withColors([
      {
        id: "godrun",
        label: "连胜到怀疑外挂是自己",
        weight: 14,
        effects: { form: 5, aim: 2, mentality: 3 } as StatDelta,
        flags: ["secret_streak"],
      },
      {
        id: "teach",
        label: "带萌新，被气笑",
        weight: 24,
        effects: { mentality: 2, leadership: 2, form: -1 } as StatDelta,
      },
      {
        id: "tilt_queue",
        label: "连跪后把鼠标拍响",
        weight: 22,
        effects: { mentality: -5, form: -2 } as StatDelta,
        flags: ["solo_tilt"],
      },
      {
        id: "watch_vod",
        label: "不打了，改复盘决赛 VOD",
        weight: 20,
        effects: { sense: 3, attitude: 2 } as StatDelta,
      },
      {
        id: "sleep",
        label: "十一点准时睡觉（传说级操作）",
        weight: 20,
        effects: { form: 3, mentality: 2 } as StatDelta,
        flags: ["slept_well"],
      },
    ]),
  };
}

/** 粉丝见面 / 签售 */
export function evtFanmeet(p: PlayerState): RuntimeEvent {
  return {
    id: "fanmeet",
    title: "线下见面会",
    blurb: p.judges.appearance >= 70 ? "尖叫几乎掀屋顶。" : "队伍安静，有人递来手绘应援。",
    kind: "life",
    adapt: { boostIds: ["warm"], cutIds: ["awkward"], by: ["appearance", "fame", "mentality"], scale: 0.55 },
    options: withColors([
      {
        id: "warm",
        label: "逐个对视，把签名写认真",
        weight: 30,
        effects: { fame: 4, mentality: 3, appearance: 1 } as StatDelta,
        flags: ["fan_love"],
      },
      {
        id: "awkward",
        label: "社恐发作，只敢看桌子",
        weight: 22,
        effects: { mentality: -2, fame: 1 } as StatDelta,
      },
      {
        id: "gift",
        label: "回赠自己的旧外设",
        weight: 18,
        effects: { fame: 5, loyalty: 1, mentality: 2 } as StatDelta,
      },
      {
        id: "late",
        label: "迟到被粉丝温和审判",
        weight: 18,
        effects: { fame: -2, mentality: -3 } as StatDelta,
      },
      {
        id: "stream",
        label: "即兴开播联机粉丝",
        weight: 12,
        effects: { fame: 6, form: -1, mentality: 2 } as StatDelta,
        flags: ["went_viral"],
      },
    ]),
  };
}

/** 签证 / 出行荒诞 */
export function evtTravelDrama(): RuntimeEvent {
  return {
    id: "travel_drama",
    title: "飞往赛事地的那天",
    blurb: "登机口在广播，你的护照在命运。",
    kind: "life",
    options: withColors([
      {
        id: "smooth",
        label: "一切顺利，落地还能睡一觉",
        weight: 36,
        effects: { form: 2, mentality: 2 } as StatDelta,
      },
      {
        id: "lost_bag",
        label: "托运行李去了平行宇宙",
        weight: 22,
        effects: { mentality: -3, form: -1 } as StatDelta,
        flags: ["lost_luggage"],
      },
      {
        id: "visa",
        label: "签证卡关，改线上打",
        weight: 14,
        effects: { fame: -2, mentality: -4, form: -2 } as StatDelta,
        flags: ["visa_fail"],
      },
      {
        id: "upgrade",
        label: "被升舱，赛前意外享受",
        weight: 12,
        effects: { mentality: 4, fame: 1 } as StatDelta,
      },
      {
        id: "food",
        label: "机场餐让胃宣布独立",
        weight: 16,
        effects: { form: -3, mentality: -1 } as StatDelta,
        flags: ["food_poison"],
      },
    ]),
  };
}

/** 年末奖项 */
export function evtAwards(p: PlayerState): RuntimeEvent {
  const pull = (p.judges.fame + p.judges.form + p.stats.aim) / 3;
  return {
    id: "awards",
    title: `${p.year} · 年度颁奖夜`,
    blurb: "红毯不红，聚光灯很白。",
    kind: "form",
    adapt: { boostIds: ["mvp", "top20"], cutIds: ["snub"], by: ["fame", "form", "aim"], scale: 0.65 },
    options: withColors([
      {
        id: "mvp",
        label: "捧起赛事 MVP",
        weight: Math.max(4, pull * 0.12),
        effects: { fame: 10, mentality: 5, form: 3 } as StatDelta,
        flags: ["award_mvp"],
      },
      {
        id: "top20",
        label: "挤进民间 Top20 榜",
        weight: Math.max(8, pull * 0.2),
        effects: { fame: 6, mentality: 3 } as StatDelta,
        flags: ["award_top20"],
      },
      {
        id: "team",
        label: "队伍获最佳阵容提名",
        weight: 22,
        effects: { fame: 3, loyalty: 2 } as StatDelta,
      },
      {
        id: "snub",
        label: "陪跑：名字停在候选栏",
        weight: 28,
        effects: { mentality: -3, attitude: 1 } as StatDelta,
      },
      {
        id: "skip",
        label: "拒参加，回家睡觉",
        weight: 14,
        effects: { mentality: 2, fame: -2 } as StatDelta,
      },
    ]),
  };
}

/** 从状态池抽 0～2 条趣味支线 */
export function pickFlavorArcs(p: PlayerState, rng = Math.random): RuntimeEvent[] {
  const age = p.year - (p.debutYear || p.year);
  const pool: { w: number; make: () => RuntimeEvent }[] = [
    { w: 1.1, make: () => evtBootcamp(p) },
    { w: 1.0, make: () => evtMedia(p) },
    { w: p.judges.fame > 45 ? 1.2 : 0.5, make: () => evtSponsor(p) },
    { w: 0.9, make: () => evtChemistry(p) },
    { w: 0.85, make: () => evtRankedNight(p) },
    { w: p.judges.fame > 40 || p.judges.appearance > 60 ? 1.0 : 0.4, make: () => evtFanmeet(p) },
    { w: 0.7, make: () => evtTravelDrama() },
    { w: age >= 1 ? 0.8 : 0.2, make: () => evtAwards(p) },
  ];

  // 心态低更易出化学/红温相关
  if (p.stats.mentality < 45) {
    pool.push({ w: 1.4, make: () => evtChemistry(p) });
  }
  if (mood(p) > 70) {
    pool.push({ w: 1.1, make: () => evtFanmeet(p) });
  }

  const out: RuntimeEvent[] = [];
  const n = rng() < 0.25 ? 0 : rng() < 0.65 ? 1 : 2;
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    const sum = pool.reduce((s, x) => s + x.w, 0);
    let r = rng() * sum;
    for (const item of pool) {
      r -= item.w;
      if (r <= 0) {
        const ev = item.make();
        if (!used.has(ev.id)) {
          used.add(ev.id);
          out.push(ev);
        }
        break;
      }
    }
  }
  return out;
}
