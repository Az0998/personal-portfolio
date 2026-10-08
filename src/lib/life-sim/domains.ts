import type { DomainMeta, EventCard, LifeRun, StatMap } from "./types";
import { MORTAL_POOL, MORTAL_STATS, createMortalRun } from "./mortal";
import { HYDRO_POOL, HYDRO_STATS, createHydroRun } from "./hydro-career";
import { NIGHT_POOL, NIGHT_STATS, createNightRun } from "./night";
import {
  ACADEMY_POOL,
  ACADEMY_STATS,
  ISEKAI_POOL,
  ISEKAI_STATS,
  MECHA_POOL,
  MECHA_STATS,
  XIANXIA_POOL,
  XIANXIA_STATS,
  createAcademyRun,
  createIsekaiRun,
  createMechaRun,
  createXianxiaRun,
} from "./fanfic";

export const DOMAINS: DomainMeta[] = [
  {
    id: "cs",
    title: "CS 职业人生",
    tagline: "训练营 · Major 链 · 媒体赞助 · 更衣室气流",
    href: "/cs-life",
    accent: "#ea580c",
    stats: [
      { key: "aim", label: "瞄准" },
      { key: "utility", label: "道具" },
      { key: "sense", label: "理解" },
      { key: "mentality", label: "心态" },
      { key: "attitude", label: "态度" },
      { key: "leadership", label: "指挥" },
    ],
    judges: [
      { key: "appearance", label: "颜值" },
      { key: "loyalty", label: "忠诚" },
      { key: "fame", label: "名气" },
      { key: "form", label: "状态" },
      { key: "clutch", label: "残局" },
    ],
  },
  {
    id: "mortal",
    title: "凡人重开",
    tagline: "雨伞、夜市、热搜与远房来信",
    href: "/life-sim/mortal",
    accent: "#0d9488",
    stats: MORTAL_STATS,
  },
  {
    id: "hydro",
    title: "水信息职场",
    tagline: "Excel 战争 · 失踪数据 · 巡河黄昏",
    href: "/life-sim/hydro",
    accent: "#0284c7",
    stats: HYDRO_STATS,
  },
  {
    id: "night",
    title: "都市夜谈",
    tagline: "天台、末班车、关东煮审判",
    href: "/life-sim/night",
    accent: "#b45309",
    stats: NIGHT_STATS,
  },
  {
    id: "xianxia",
    title: "修仙同人",
    tagline: "山门 · 秘境 · 渡劫 · 道侣 —— 类型致敬，原创桥段",
    href: "/life-sim/xianxia",
    accent: "#0f766e",
    stats: XIANXIA_STATS,
  },
  {
    id: "isekai",
    title: "异世界转生",
    tagline: "外挂 · 小队 · 迷宫 · 传送门 —— 同人梗合集",
    href: "/life-sim/isekai",
    accent: "#c2410c",
    stats: ISEKAI_STATS,
  },
  {
    id: "academy",
    title: "魔法学院同人",
    tagline: "原创四院 · 课堂事故 · 禁林 · 毕业钟楼",
    href: "/life-sim/academy",
    accent: "#1d4ed8",
    stats: ACADEMY_STATS,
  },
  {
    id: "mecha",
    title: "机甲星际同人",
    tagline: "同步率 · 机库午夜 · 出击 · 星域裂缝",
    href: "/life-sim/mecha",
    accent: "#334155",
    stats: MECHA_STATS,
  },
];

export function domainById(id: string): DomainMeta | undefined {
  return DOMAINS.find((d) => d.id === id);
}

export function poolFor(domainId: string): EventCard[] {
  switch (domainId) {
    case "mortal":
      return MORTAL_POOL;
    case "hydro":
      return HYDRO_POOL;
    case "night":
      return NIGHT_POOL;
    case "xianxia":
      return XIANXIA_POOL;
    case "isekai":
      return ISEKAI_POOL;
    case "academy":
      return ACADEMY_POOL;
    case "mecha":
      return MECHA_POOL;
    default:
      return [];
  }
}

export function createRun(domainId: string, seed = `${Date.now()}`): LifeRun {
  switch (domainId) {
    case "mortal":
      return createMortalRun(seed);
    case "hydro":
      return createHydroRun(seed);
    case "night":
      return createNightRun(seed);
    case "xianxia":
      return createXianxiaRun(seed);
    case "isekai":
      return createIsekaiRun(seed);
    case "academy":
      return createAcademyRun(seed);
    case "mecha":
      return createMechaRun(seed);
    default:
      return {
        domainId,
        age: 18,
        stats: {},
        flags: [],
        log: [],
        queue: [],
        ended: false,
        seed,
      };
  }
}

export function resolveCard(domainId: string, id: string, run: LifeRun): EventCard | null {
  const found = poolFor(domainId).find((c) => c.id === id);
  if (found) return found;
  void run;
  return null;
}

export function blankStatsFromMeta(meta: DomainMeta): StatMap {
  const s: StatMap = {};
  for (const st of meta.stats) s[st.key] = 50;
  return s;
}
