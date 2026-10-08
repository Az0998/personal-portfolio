/**
 * 同人题材风人生模拟 —— 原创桥段与代称，致敬类型而非搬运官方设定/原文。
 */
import type { EventCard, LifeRun, StatMap } from "./types";

function randStats(keys: string[], lo = 35, span = 35): StatMap {
  const s: StatMap = {};
  for (const k of keys) s[k] = lo + Math.floor(Math.random() * span);
  return s;
}

function runOf(domainId: string, age: number, stats: StatMap, seed: string): LifeRun {
  return { domainId, age, stats, flags: [], log: [], queue: [], ended: false, seed };
}

/* ───────── 修仙同人 ───────── */

export const XIANXIA_STATS = [
  { key: "root", label: "根骨" },
  { key: "dao", label: "悟性" },
  { key: "qi", label: "灵力" },
  { key: "heart", label: "道心" },
  { key: "face", label: "气运" },
  { key: "karma", label: "业障" },
];

export function createXianxiaRun(seed = `${Date.now()}`): LifeRun {
  return runOf("xianxia", 16, randStats(["root", "dao", "qi", "heart", "face", "karma"], 30, 40), seed);
}

export const XIANXIA_POOL: EventCard[] = [
  {
    id: "xx_sect",
    title: "山门招新",
    blurb: "长老扫来一眼，像在称你骨头的斤两。",
    minAge: 16,
    maxAge: 20,
    adapt: { boostIds: ["inner", "hidden"], cutIds: ["outer"], byStats: ["root", "face", "dao"], scale: 0.55 },
    options: [
      { id: "inner", label: "被点入内门", weight: 12, delta: { qi: 6, face: 4, heart: 2 }, addFlags: ["inner_sect"], enqueue: ["xx_master"] },
      { id: "outer", label: "外门杂役起步", weight: 32, delta: { root: 2, karma: -1, heart: 1 }, addFlags: ["outer_sect"], enqueue: ["xx_chore"] },
      { id: "hidden", label: "无名峰收记名弟子", weight: 16, delta: { dao: 5, face: 3, heart: 3 }, addFlags: ["hidden_line"], enqueue: ["xx_master"] },
      { id: "reject", label: "被判不宜修仙", weight: 18, delta: { heart: -6, face: -2 }, addFlags: ["rejected"], enqueue: ["xx_rogue"] },
      { id: "cheat", label: "用来历不明玉简蒙混", weight: 10, delta: { face: 5, karma: 8, qi: 3 }, addFlags: ["dark_jade", "inner_sect"], enqueue: ["xx_master"] },
      { id: "leave", label: "扭头下山闯江湖", weight: 12, delta: { heart: 2, karma: 2 }, addFlags: ["rogue"], enqueue: ["xx_rogue"] },
    ],
  },
  {
    id: "xx_master",
    title: "拜师礼",
    options: [
      { id: "strict", label: "严师：日出打坐日落挨训", weight: 30, delta: { qi: 4, heart: -2, dao: 3 }, addFlags: ["strict_master"] },
      { id: "kind", label: "慈师：先喂一枚筑基丹", weight: 28, delta: { qi: 6, heart: 4, face: 2 }, addFlags: ["kind_master"] },
      { id: "absent", label: "师尊闭关，你自学成精", weight: 24, delta: { dao: 5, heart: 1, qi: 2 }, addFlags: ["self_taught"] },
      { id: "rival", label: "师兄当众下马威", weight: 18, delta: { heart: -3, karma: 2, qi: 1 }, addFlags: ["sect_rival"], enqueue: ["xx_duel"] },
    ],
  },
  {
    id: "xx_chore",
    title: "外门杂役岁月",
    includeFlags: ["outer_sect"],
    minAge: 16,
    maxAge: 35,
    options: [
      { id: "steal_time", label: "偷空修炼反被赏识", weight: 22, delta: { qi: 3, face: 2, heart: 1 }, addFlags: ["noticed"], enqueue: ["xx_master"] },
      { id: "herb", label: "药园认你半个主人", weight: 26, delta: { dao: 2, qi: 2, face: 1 }, addFlags: ["herbalist"] },
      { id: "bully", label: "被内门使唤到腿软", weight: 24, delta: { heart: -4, karma: 1 }, addFlags: ["bullied"] },
      { id: "escape", label: "夜半偷下峰", weight: 16, delta: { face: 2, karma: 3 }, addFlags: ["rogue"], enqueue: ["xx_rogue"] },
      { id: "endure", label: "咬牙三年默默筑基", weight: 12, delta: { qi: 5, heart: 3, root: 2 }, addFlags: ["late_bloomer"] },
    ],
  },
  {
    id: "xx_rogue",
    title: "散修风雨路",
    options: [
      { id: "market", label: "坊市摆摊卖劣质符", weight: 28, delta: { face: 2, qi: 1, karma: 1 }, addFlags: ["market_rat"] },
      { id: "salvage", label: "古修洞府捡半卷残诀", weight: 16, delta: { dao: 6, qi: 3, face: 4, karma: 4 }, addFlags: ["ruin_luck"], enqueue: ["xx_tribulation"] },
      { id: "bandit", label: "被迫加入劫修一天", weight: 18, delta: { karma: 10, heart: -5, qi: 2 }, addFlags: ["bandit_day"] },
      { id: "save", label: "救下受伤宗门弟子", weight: 22, delta: { heart: 5, face: 3, karma: -3 }, addFlags: ["savior"] },
      { id: "lonely", label: "把月亮看成道侣", weight: 16, delta: { heart: 2, dao: 2 } },
    ],
  },
  {
    id: "xx_duel",
    title: "比武台下的起哄",
    adapt: { boostIds: ["win"], cutIds: ["lose"], byStats: ["qi", "root", "heart"], scale: 0.55 },
    options: [
      { id: "win", label: "险胜：剑尖停在喉前一寸", weight: 18, delta: { qi: 3, face: 6, heart: 2 }, addFlags: ["duel_win"] },
      { id: "lose", label: "败得干净，赢来有骨气", weight: 24, delta: { heart: 3, face: -2, dao: 2 } },
      { id: "cheat", label: "暗器被揭穿全场哗然", weight: 14, delta: { face: -8, karma: 6, heart: -3 }, addFlags: ["disgrace"] },
      { id: "draw", label: "平手，约三年后再战", weight: 26, delta: { qi: 2, heart: 2 }, addFlags: ["rival_oath"] },
      { id: "forfeit", label: "弃权去救暴动灵兽", weight: 18, delta: { heart: 4, face: 1, karma: -2 }, addFlags: ["beast_friend"] },
    ],
  },
  {
    id: "xx_secret",
    title: "秘境开启",
    minAge: 18,
    maxAge: 120,
    adapt: { boostIds: ["core"], cutIds: ["trap"], byStats: ["dao", "face", "qi"], scale: 0.5 },
    options: [
      { id: "core", label: "夺得灵物核心", weight: 14, delta: { qi: 8, face: 5, karma: 2 }, addFlags: ["got_core"], enqueue: ["xx_tribulation"] },
      { id: "map", label: "只带回残缺地图", weight: 26, delta: { dao: 3, face: 1 }, addFlags: ["has_map"] },
      { id: "trap", label: "踩中禁制险些魂飞", weight: 20, delta: { qi: -6, heart: -4, karma: 3 }, addFlags: ["injured"] },
      { id: "ally", label: "与死对头短暂结盟", weight: 22, delta: { heart: 2, face: 2 }, addFlags: ["temp_ally"] },
      { id: "empty", label: "宝尽人散，赚到见识", weight: 18, delta: { dao: 4, heart: 2 } },
    ],
  },
  {
    id: "xx_tribulation",
    title: "渡劫之夜",
    blurb: "天雷不讲情面，只讲你欠不欠。",
    requireStats: { qi: 48 },
    adapt: { boostIds: ["pass"], cutIds: ["fail"], byStats: ["qi", "heart", "face"], scale: 0.65 },
    options: [
      { id: "pass", label: "劫过：境界抬了一寸天", weight: 14, delta: { qi: 10, dao: 4, heart: 4, face: 6 }, addFlags: ["ascended_once"] },
      { id: "scar", label: "勉强过劫留下道痕", weight: 28, delta: { qi: 5, heart: 2, root: -2 }, addFlags: ["tribulation_scar"] },
      { id: "fail", label: "劫挫：修为退，心更明", weight: 22, delta: { qi: -8, dao: 3, heart: 3, karma: -2 }, addFlags: ["failed_trib"] },
      { id: "help", label: "有人在云外替你挡一道", weight: 18, delta: { qi: 6, heart: 5, karma: -1, face: 3 }, addFlags: ["debt_of_life"] },
      { id: "demonic", label: "借魔气硬抗", weight: 10, delta: { qi: 8, karma: 12, heart: -6 }, addFlags: ["demonic_path"] },
    ],
  },
  {
    id: "xx_dao_partner",
    title: "道侣议题",
    minAge: 25,
    maxAge: 160,
    excludeFlags: ["dao_partner"],
    adapt: { boostIds: ["yes"], cutIds: ["no"], byStats: ["heart", "face", "dao"], scale: 0.45 },
    options: [
      { id: "yes", label: "双修契成，山河作证", weight: 22, delta: { heart: 6, qi: 3, dao: 2 }, addFlags: ["dao_partner"] },
      { id: "no", label: "道心如井暂不旁顾", weight: 30, delta: { dao: 3, heart: 1 }, addFlags: ["solo_dao"] },
      { id: "tragic", label: "有缘无份散作天涯", weight: 20, delta: { heart: -5, dao: 4 }, addFlags: ["lost_love"] },
      { id: "fake", label: "假意结契实为任务", weight: 16, delta: { face: 2, karma: 3, heart: -2 }, addFlags: ["fake_bond"] },
      { id: "wait", label: "把名字写进未来某页", weight: 12, delta: { heart: 3, face: 1 } },
    ],
  },
  {
    id: "xx_end",
    title: "飞升名单之外",
    minAge: 70,
    maxAge: 220,
    options: [
      { id: "ascend", label: "踏碎虚空而去", weight: 16, delta: { qi: 5, dao: 5, face: 8 }, addFlags: ["flew_away"] },
      { id: "stay", label: "留人界当散淡尊者", weight: 28, delta: { heart: 6, karma: -4 }, addFlags: ["worldly_immortal"] },
      { id: "teach", label: "开山收徒煮给后来人", weight: 24, delta: { dao: 3, heart: 5 }, addFlags: ["patriarch"] },
      { id: "sleep", label: "化一座无名石像", weight: 18, delta: { heart: 4 }, addFlags: ["stone_sleep"] },
      { id: "demo", label: "入魔又悔走出野路", weight: 14, delta: { karma: -6, heart: 3, dao: 4 }, addFlags: ["redemption"] },
    ],
  },
];

/* ───────── 异世界转生 ───────── */

export const ISEKAI_STATS = [
  { key: "cheat", label: "外挂" },
  { key: "brain", label: "头脑" },
  { key: "bond", label: "羁绊" },
  { key: "combat", label: "战力" },
  { key: "fame", label: "名气" },
  { key: "homesickness", label: "思乡" },
];

export function createIsekaiRun(seed = `${Date.now()}`): LifeRun {
  return runOf("isekai", 0, randStats(["cheat", "brain", "bond", "combat", "fame", "homesickness"], 40, 35), seed);
}

export const ISEKAI_POOL: EventCard[] = [
  {
    id: "ik_truck",
    title: "经典开局（请自行脑补音效）",
    blurb: "白光。系统音。以及一句：「恭喜。」",
    minAge: 0,
    maxAge: 2,
    options: [
      { id: "warrior", label: "转生为勇者候补", weight: 22, delta: { combat: 8, cheat: 4, homesickness: 2 }, addFlags: ["hero_route"], enqueue: ["ik_party"] },
      { id: "mage", label: "转生为魔导书蛀虫", weight: 22, delta: { brain: 8, cheat: 5 }, addFlags: ["mage_route"], enqueue: ["ik_party"] },
      { id: "villainess", label: "穿成反派千金", weight: 18, delta: { fame: 4, brain: 4, bond: 2, cheat: 3 }, addFlags: ["villainess"], enqueue: ["ik_otome"] },
      { id: "slime", label: "变成软萌史莱姆", weight: 16, delta: { cheat: 10, combat: 2, bond: 3 }, addFlags: ["slime"], enqueue: ["ik_skill"] },
      { id: "npc", label: "路人 NPC，却记得前世", weight: 14, delta: { brain: 6, homesickness: 5, cheat: 2 }, addFlags: ["npc_mind"], enqueue: ["ik_skill"] },
      { id: "god", label: "神让你自由发挥", weight: 8, delta: { cheat: 6, homesickness: 3 }, addFlags: ["free_agent"], enqueue: ["ik_skill"] },
    ],
  },
  {
    id: "ik_skill",
    title: "技能觉醒转盘",
    options: [
      { id: "op", label: "开出传说级外挂", weight: 10, delta: { cheat: 12, fame: 4 }, addFlags: ["op_skill"] },
      { id: "craft", label: "制作系：木勺到魔炮", weight: 24, delta: { brain: 5, cheat: 4 }, addFlags: ["crafter"] },
      { id: "talk", label: "能与魔物交谈", weight: 20, delta: { bond: 6, cheat: 3 }, addFlags: ["beast_tongue"] },
      { id: "useless", label: "看似废材，藏隐藏条件", weight: 22, delta: { cheat: 2, brain: 3 }, addFlags: ["sleeping_cheat"], enqueue: ["ik_hidden"] },
      { id: "copy", label: "复制别人绝招一次", weight: 14, delta: { combat: 5, cheat: 4, fame: 2 }, addFlags: ["copycat"] },
      { id: "cook", label: "料理即回血", weight: 10, delta: { bond: 4, cheat: 3 }, addFlags: ["chef_hero"] },
    ],
  },
  {
    id: "ik_party",
    title: "冒险者小队招募",
    options: [
      { id: "balanced", label: "坦克奶妈输出凑齐", weight: 28, delta: { bond: 5, combat: 3 }, addFlags: ["party_ok"], enqueue: ["ik_dungeon"] },
      { id: "solo", label: "我自己就是军队", weight: 18, delta: { combat: 5, bond: -2, cheat: 2 }, addFlags: ["solo_clear"], enqueue: ["ik_dungeon"] },
      { id: "betray", label: "队友里混进剧情反派", weight: 16, delta: { bond: -4, brain: 2, fame: 1 }, addFlags: ["traitor"], enqueue: ["ik_dungeon"] },
      { id: "idol", label: "队里有个只会唱歌的偶像", weight: 20, delta: { bond: 4, fame: 4, combat: -1 }, addFlags: ["idol_party"], enqueue: ["ik_dungeon"] },
      { id: "kids", label: "全是孩子，你当家长", weight: 18, delta: { bond: 6, homesickness: -2, brain: 2 }, addFlags: ["dad_friend"], enqueue: ["ik_dungeon"] },
    ],
  },
  {
    id: "ik_otome",
    title: "攻略对象出现了",
    includeFlags: ["villainess"],
    adapt: { boostIds: ["capture"], cutIds: ["destroy"], byStats: ["bond", "brain", "fame"], scale: 0.5 },
    options: [
      { id: "capture", label: "走心路线改写坏结局", weight: 24, delta: { bond: 8, fame: 3, homesickness: -2 }, addFlags: ["route_clear"] },
      { id: "destroy", label: "偏要当大女主反派", weight: 22, delta: { fame: 6, combat: 3, bond: -2 }, addFlags: ["villain_queen"] },
      { id: "friend", label: "把攻略对象全变成朋友", weight: 20, delta: { bond: 6, brain: 2 }, addFlags: ["friend_end"] },
      { id: "flee", label: "退学创业卖魔药", weight: 18, delta: { brain: 4, cheat: 3, fame: 2 }, addFlags: ["potion_shop"] },
      { id: "meta", label: "当众揭穿这是脚本", weight: 16, delta: { brain: 5, fame: 5, bond: -3 }, addFlags: ["meta_break"] },
    ],
  },
  {
    id: "ik_dungeon",
    title: "迷宫深层",
    adapt: { boostIds: ["boss"], cutIds: ["wipe"], byStats: ["combat", "cheat", "brain"], scale: 0.55 },
    options: [
      { id: "boss", label: "讨伐首领掉落会发光", weight: 16, delta: { combat: 5, fame: 6, cheat: 2 }, addFlags: ["boss_kill"] },
      { id: "puzzle", label: "用前世理科开锁", weight: 24, delta: { brain: 5, cheat: 2 }, addFlags: ["puzzle_clear"] },
      { id: "wipe", label: "团灭边缘被神秘人救", weight: 18, delta: { bond: 3, combat: -2, homesickness: 2 }, addFlags: ["rescued"] },
      { id: "skip", label: "发现捷径，道德压力+1", weight: 20, delta: { brain: 2, fame: -1, cheat: 1 } },
      { id: "pet", label: "收服迷宫猫当吉祥物", weight: 22, delta: { bond: 5, fame: 2 }, addFlags: ["dungeon_cat"] },
    ],
  },
  {
    id: "ik_hidden",
    title: "废材光环裂开了",
    includeFlags: ["sleeping_cheat"],
    options: [
      { id: "awake", label: "真正外挂苏醒", weight: 40, delta: { cheat: 15, combat: 6, fame: 5 }, addFlags: ["op_skill"], removeFlags: ["sleeping_cheat"] },
      { id: "half", label: "只醒一半反而更稳", weight: 35, delta: { cheat: 7, brain: 3 }, addFlags: ["stable_cheat"] },
      { id: "cost", label: "代价是忘记地球味道", weight: 25, delta: { cheat: 10, homesickness: 8 }, addFlags: ["op_skill", "forgot_home"] },
    ],
  },
  {
    id: "ik_kingdom",
    title: "王都政治茶会",
    minAge: 3,
    maxAge: 40,
    adapt: { boostIds: ["noble"], cutIds: ["scandal"], byStats: ["fame", "brain", "bond"], scale: 0.45 },
    options: [
      { id: "noble", label: "被赐爵，日程表开始流血", weight: 20, delta: { fame: 6, brain: 2, homesickness: 2 }, addFlags: ["noble"] },
      { id: "spy", label: "无意听闻政变八卦", weight: 22, delta: { brain: 4, fame: 1 }, addFlags: ["knows_too_much"] },
      { id: "scandal", label: "登上八卦小报头版", weight: 18, delta: { fame: 5, bond: -3 }, addFlags: ["tabloid"] },
      { id: "school", label: "去魔导院当交换生", weight: 24, delta: { brain: 4, bond: 2 }, addFlags: ["exchange"] },
      { id: "home", label: "当众说我想回家", weight: 16, delta: { homesickness: 6, bond: 3, fame: 2 }, addFlags: ["said_it"] },
    ],
  },
  {
    id: "ik_end",
    title: "传送门再度闪烁",
    minAge: 12,
    maxAge: 60,
    options: [
      { id: "return", label: "回家，剑留在那边", weight: 22, delta: { homesickness: -10, bond: -2, fame: 2 }, addFlags: ["went_home"] },
      { id: "stay", label: "留下当第二故乡", weight: 28, delta: { bond: 6, homesickness: -4 }, addFlags: ["stayed"] },
      { id: "commute", label: "两界通勤打工人成神", weight: 18, delta: { cheat: 3, brain: 3, homesickness: 2 }, addFlags: ["commuter"] },
      { id: "reset", label: "请求重开新的转生", weight: 16, delta: { cheat: 2 }, addFlags: ["new_gameplus"] },
      { id: "write", label: "写成见闻录爆火", weight: 16, delta: { fame: 8, brain: 2 }, addFlags: ["author"] },
    ],
  },
];

/* ───────── 魔法学院同人 ───────── */

export const ACADEMY_STATS = [
  { key: "spell", label: "咒文" },
  { key: "wit", label: "机敏" },
  { key: "house", label: "归属" },
  { key: "brave", label: "勇气" },
  { key: "dark", label: "阴影" },
  { key: "grade", label: "学业" },
];

export function createAcademyRun(seed = `${Date.now()}`): LifeRun {
  return runOf("academy", 11, randStats(["spell", "wit", "house", "brave", "dark", "grade"], 40, 30), seed);
}

export const ACADEMY_POOL: EventCard[] = [
  {
    id: "ac_sorting",
    title: "分院礼（原创四院）",
    blurb: "帽子很旧，脾气很新。院名是我们自己起的。",
    minAge: 11,
    maxAge: 12,
    options: [
      { id: "ember", label: "燃灯院：勇气与莽撞", weight: 25, delta: { brave: 8, house: 6 }, addFlags: ["house_ember"] },
      { id: "quill", label: "墨羽院：书页比咒语先响", weight: 25, delta: { wit: 8, grade: 4, house: 6 }, addFlags: ["house_quill"] },
      { id: "grove", label: "青藤院：温柔也是法术", weight: 25, delta: { house: 8, spell: 2, dark: -2 }, addFlags: ["house_grove"] },
      { id: "ash", label: "灰塔院：野心被允许公开", weight: 20, delta: { dark: 4, wit: 3, house: 5 }, addFlags: ["house_ash"] },
      { id: "hat", label: "帽子卡壳两边都不想选", weight: 5, delta: { wit: 2, brave: 2, house: 2 }, addFlags: ["hat_stuck"] },
    ],
  },
  {
    id: "ac_class",
    title: "变形学课堂事故",
    minAge: 11,
    maxAge: 17,
    adapt: { boostIds: ["perfect"], cutIds: ["frog"], byStats: ["spell", "grade", "wit"], scale: 0.5 },
    options: [
      { id: "perfect", label: "一次成功，教授难得鼓掌", weight: 16, delta: { spell: 5, grade: 4, house: 2 }, addFlags: ["class_star"] },
      { id: "frog", label: "把自己变成蛙三分钟", weight: 26, delta: { spell: 1, dark: 1, grade: -1 }, addFlags: ["frog_day"] },
      { id: "help", label: "帮同桌修好失控羽毛笔", weight: 24, delta: { house: 3, wit: 2, brave: 1 }, addFlags: ["helpful"] },
      { id: "cheat", label: "偷看答案被猫头鹰瞪", weight: 18, delta: { grade: 2, dark: 3, house: -2 } },
      { id: "skip", label: "装病去禁书区门口晃", weight: 16, delta: { wit: 3, dark: 2, grade: -2 }, addFlags: ["curious"] },
    ],
  },
  {
    id: "ac_match",
    title: "空中球类对抗赛",
    blurb: "不是某部版权运动，但气氛很像。",
    minAge: 12,
    maxAge: 18,
    adapt: { boostIds: ["mvp"], cutIds: ["bench"], byStats: ["brave", "spell", "wit"], scale: 0.5 },
    options: [
      { id: "mvp", label: "绝杀，围巾飞起来了", weight: 14, delta: { brave: 5, house: 6, spell: 1 }, addFlags: ["match_hero"] },
      { id: "injury", label: "摔得好看骨头一般", weight: 20, delta: { brave: 2, grade: -1, dark: 1 }, addFlags: ["injured"] },
      { id: "bench", label: "板凳视角写战报更清", weight: 24, delta: { wit: 3, house: 1 } },
      { id: "fair", label: "指出犯规全场安静", weight: 22, delta: { brave: 3, house: 2, dark: -1 }, addFlags: ["fair_play"] },
      { id: "party", label: "赛后休息室派对到凌晨", weight: 20, delta: { house: 4, grade: -2, spell: 1 } },
    ],
  },
  {
    id: "ac_forest",
    title: "禁林边缘实习",
    minAge: 13,
    maxAge: 18,
    options: [
      { id: "creature", label: "与神奇动物对上眼", weight: 24, delta: { spell: 3, brave: 3, house: 2 }, addFlags: ["beast_friend"] },
      { id: "lost", label: "迷路靠星象走出来", weight: 22, delta: { wit: 4, brave: 2 } },
      { id: "dark", label: "听见不该听见的低语", weight: 18, delta: { dark: 6, spell: 2, house: -1 }, addFlags: ["heard_whispers"], enqueue: ["ac_prophecy"] },
      { id: "teacher", label: "救下被藤蔓缠住的教授", weight: 20, delta: { house: 4, brave: 4, grade: 2 }, addFlags: ["teacher_debt"] },
      { id: "picnic", label: "把实习变成野餐（扣分）", weight: 16, delta: { house: 2, grade: -3, dark: -1 } },
    ],
  },
  {
    id: "ac_prophecy",
    title: "预言课的纸条",
    options: [
      { id: "burn", label: "烧掉，不当真", weight: 30, delta: { dark: -3, brave: 2 } },
      { id: "follow", label: "按纸条去钟楼", weight: 28, delta: { dark: 3, wit: 2, brave: 3 }, addFlags: ["prophecy_path"], enqueue: ["ac_final"] },
      { id: "share", label: "告诉最信任的人", weight: 26, delta: { house: 4, dark: 1 }, addFlags: ["shared_secret"] },
      { id: "joke", label: "改成笑话登院报", weight: 16, delta: { wit: 3, dark: -1, house: 1 } },
    ],
  },
  {
    id: "ac_exam",
    title: "学年大考",
    minAge: 14,
    maxAge: 18,
    adapt: { boostIds: ["owl"], cutIds: ["fail"], byStats: ["grade", "spell", "wit"], scale: 0.6 },
    options: [
      { id: "owl", label: "成绩优异猫头鹰都累了", weight: 16, delta: { grade: 8, spell: 3, house: 3 }, addFlags: ["top_student"] },
      { id: "pass", label: "中游飘过假期保全", weight: 34, delta: { grade: 3, house: 1 } },
      { id: "fail", label: "补考通知比魔咒准", weight: 20, delta: { grade: -5, dark: 2 }, addFlags: ["summer_school"] },
      { id: "cheat", label: "用时之沙想多写两行——被抓", weight: 14, delta: { grade: -3, dark: 4, house: -3 }, addFlags: ["caught_cheat"] },
      { id: "focus", label: "只攻一门成偏科天才", weight: 16, delta: { spell: 6, grade: 2, wit: 1 }, addFlags: ["specialist"] },
    ],
  },
  {
    id: "ac_final",
    title: "毕业夜的钟楼",
    minAge: 17,
    maxAge: 19,
    options: [
      { id: "hero", label: "阻止一次小型灾难", weight: 22, delta: { brave: 6, spell: 4, house: 4 }, addFlags: ["grad_hero"] },
      { id: "love", label: "把信放进某人书包", weight: 24, delta: { house: 5, dark: -2 }, addFlags: ["grad_letter"] },
      { id: "job", label: "拿到部实习聘书", weight: 20, delta: { grade: 3, wit: 3 }, addFlags: ["ministry"] },
      { id: "wander", label: "背上包去旅合法师世界", weight: 18, delta: { brave: 4, spell: 2 }, addFlags: ["wander_mage"] },
      { id: "teach", label: "留下来当助教", weight: 16, delta: { house: 4, grade: 2, spell: 2 }, addFlags: ["stay_teach"] },
    ],
  },
];

/* ───────── 机甲星际同人 ───────── */

export const MECHA_STATS = [
  { key: "sync", label: "同步率" },
  { key: "guts", label: "胆量" },
  { key: "tech", label: "机工" },
  { key: "tactics", label: "战术" },
  { key: "bond", label: "羁绊" },
  { key: "stress", label: "压力" },
];

export function createMechaRun(seed = `${Date.now()}`): LifeRun {
  return runOf("mecha", 16, randStats(["sync", "guts", "tech", "tactics", "bond", "stress"], 38, 32), seed);
}

export const MECHA_POOL: EventCard[] = [
  {
    id: "mc_recruit",
    title: "驾驶员征选",
    blurb: "体检表比情书还长。",
    minAge: 16,
    maxAge: 20,
    adapt: { boostIds: ["ace"], cutIds: ["fail"], byStats: ["sync", "guts"], scale: 0.55 },
    options: [
      { id: "ace", label: "同步率爆表，当场入选", weight: 14, delta: { sync: 10, guts: 4, stress: 2 }, addFlags: ["pilot"], enqueue: ["mc_hangar"] },
      { id: "ok", label: "勉强合格，从副驾开始", weight: 30, delta: { sync: 4, tech: 2, stress: 1 }, addFlags: ["copilot"], enqueue: ["mc_hangar"] },
      { id: "fail", label: "晕机，被分去地勤", weight: 22, delta: { tech: 6, sync: -2, stress: -1 }, addFlags: ["ground"], enqueue: ["mc_hangar"] },
      { id: "hack", label: "黑进模拟器刷成绩——被抓", weight: 12, delta: { tech: 4, stress: 4, guts: -2 }, addFlags: ["caught"], enqueue: ["mc_hangar"] },
      { id: "refuse", label: "拒征，回家修摩托", weight: 12, delta: { tech: 5, bond: 2 }, addFlags: ["civilian"], enqueue: ["mc_city"] },
      { id: "ai", label: "与机载 AI 先对上眼", weight: 10, delta: { sync: 6, bond: 5, tech: 2 }, addFlags: ["pilot", "ai_bond"], enqueue: ["mc_hangar"] },
    ],
  },
  {
    id: "mc_hangar",
    title: "机库午夜灯",
    options: [
      { id: "tune", label: "亲手调校关节液压", weight: 28, delta: { tech: 5, sync: 2, stress: -1 }, addFlags: ["wrench"] },
      { id: "sleep", label: "在驾驶舱睡着了", weight: 22, delta: { sync: 3, stress: -3, bond: 1 } },
      { id: "rival", label: "与同期较劲到出汗", weight: 20, delta: { guts: 3, stress: 2, sync: 2 }, addFlags: ["rival"] },
      { id: "leak", label: "发现补给账对不上", weight: 16, delta: { tactics: 3, stress: 2 }, addFlags: ["knows_budget"], enqueue: ["mc_politics"] },
      { id: "song", label: "给机体取了很羞耻的名字", weight: 14, delta: { bond: 4, stress: -2 }, addFlags: ["named_mech"] },
    ],
  },
  {
    id: "mc_sortie",
    title: "首次出击",
    minAge: 17,
    maxAge: 35,
    adapt: { boostIds: ["ace_kill"], cutIds: ["eject"], byStats: ["sync", "guts", "tactics"], scale: 0.6 },
    options: [
      { id: "ace_kill", label: "首杀，耳机里一片欢呼", weight: 14, delta: { sync: 4, guts: 4, tactics: 2, stress: 2 }, addFlags: ["first_blood"] },
      { id: "cover", label: "放弃击杀去掩护队友", weight: 26, delta: { bond: 6, tactics: 3, guts: 1 }, addFlags: ["guardian"] },
      { id: "eject", label: "迫不得已弹射", weight: 18, delta: { stress: 5, sync: -3, guts: 2 }, addFlags: ["ejected"] },
      { id: "order", label: "抗命救人，事后挨训", weight: 20, delta: { bond: 5, guts: 3, stress: 3 }, addFlags: ["disobeyed"] },
      { id: "scan", label: "发现敌军异常频谱", weight: 22, delta: { tactics: 5, tech: 2 }, addFlags: ["sensor_eye"], enqueue: ["mc_mystery"] },
    ],
  },
  {
    id: "mc_mystery",
    title: "来自星域裂缝的信号",
    options: [
      { id: "chase", label: "追进去看看", weight: 24, delta: { guts: 5, sync: 3, stress: 4 }, addFlags: ["rift_chaser"], enqueue: ["mc_final"] },
      { id: "report", label: "上报，等委员会开会三年", weight: 28, delta: { tactics: 2, stress: -1 } },
      { id: "hack", label: "私下解码半段文明遗言", weight: 22, delta: { tech: 5, tactics: 2, stress: 2 }, addFlags: ["decoded"] },
      { id: "ignore", label: "当噪声关掉", weight: 16, delta: { stress: -2, guts: -1 } },
      { id: "share", label: "只告诉最信任的那个人", weight: 10, delta: { bond: 5, stress: 1 }, addFlags: ["shared_secret"] },
    ],
  },
  {
    id: "mc_politics",
    title: "司令部咖啡很苦",
    includeFlags: ["knows_budget", "disobeyed"],
    options: [
      { id: "expose", label: "吹哨，风暴准时到来", weight: 22, delta: { guts: 4, stress: 6, bond: 2 }, addFlags: ["whistle"] },
      { id: "quiet", label: "把证据锁进抽屉", weight: 30, delta: { stress: 2, tactics: 1 } },
      { id: "deal", label: "用情报换更好的机体", weight: 24, delta: { sync: 4, tech: 2, stress: 3, bond: -2 }, addFlags: ["dirty_deal"] },
      { id: "transfer", label: "申请调去边疆基地", weight: 24, delta: { guts: 3, bond: -1, stress: -2 }, addFlags: ["frontier"] },
    ],
  },
  {
    id: "mc_city",
    title: "轨道城下班高峰",
    includeFlags: ["civilian", "ground"],
    options: [
      { id: "shop", label: "开机甲配件二手店", weight: 28, delta: { tech: 5, bond: 2, stress: -2 }, addFlags: ["shop"] },
      { id: "race", label: "地下悬浮赛车一夜成名", weight: 20, delta: { guts: 5, sync: 2, stress: 3 }, addFlags: ["racer"] },
      { id: "rescue", label: "民用外骨骼参与救灾", weight: 26, delta: { bond: 5, guts: 3, tech: 2 }, addFlags: ["rescuer"] },
      { id: "enlist", label: "改主意去补征兵", weight: 16, delta: { guts: 3, stress: 2 }, addFlags: ["pilot"], enqueue: ["mc_hangar"] },
      { id: "art", label: "用报废零件做装置艺术", weight: 10, delta: { bond: 3, tech: 2, stress: -3 }, addFlags: ["artist"] },
    ],
  },
  {
    id: "mc_final",
    title: "决战编队点名",
    minAge: 20,
    maxAge: 45,
    adapt: { boostIds: ["win"], cutIds: ["loss"], byStats: ["sync", "tactics", "bond"], scale: 0.55 },
    options: [
      { id: "win", label: "防线守住，名字写进简报", weight: 18, delta: { sync: 4, tactics: 4, bond: 3, stress: 2 }, addFlags: ["war_hero"] },
      { id: "loss", label: "代价沉重的撤退", weight: 22, delta: { stress: 6, bond: 2, guts: 2 }, addFlags: ["bitter_retreat"] },
      { id: "sacrifice", label: "你留下断后", weight: 12, delta: { bond: 8, guts: 6, sync: 2 }, addFlags: ["last_stand"] },
      { id: "peace", label: "谈判比炮火先响", weight: 24, delta: { tactics: 5, bond: 4, stress: -2 }, addFlags: ["diplomat"] },
      { id: "retire", label: "卸任，去教下一期学员", weight: 24, delta: { bond: 5, stress: -4, tech: 2 }, addFlags: ["instructor"] },
    ],
  },
];
