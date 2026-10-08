import type { DomainMeta, EventCard, LifeRun, StatMap } from "./types";
import { MORTAL_POOL, MORTAL_STATS, createMortalRun } from "./mortal";
import { HYDRO_POOL, HYDRO_STATS, createHydroRun } from "./hydro-career";
import { NIGHT_POOL, NIGHT_STATS, createNightRun } from "./night";

export const DOMAINS: DomainMeta[] = [
  {
    id: "cs",
    title: "CS 职业人生",
    tagline: "训练营 · Major 链 · 媒体赞助 · 更衣室气流 · 自定义事件",
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
    tagline: "雨伞、夜市、热搜与远房来信 —— 普通日子的非常选项",
    href: "/life-sim/mortal",
    accent: "#0d9488",
    stats: MORTAL_STATS,
  },
  {
    id: "hydro",
    title: "水信息职场",
    tagline: "Excel 战争 · 失踪数据 · 巡河黄昏 · 科普开放日",
    href: "/life-sim/hydro",
    accent: "#0284c7",
    stats: HYDRO_STATS,
  },
  {
    id: "night",
    title: "都市夜谈",
    tagline: "天台、末班车、洗衣房与关东煮审判 —— 短而跳的夜游模拟",
    href: "/life-sim/night",
    accent: "#b45309",
    stats: NIGHT_STATS,
  },
];

export function domainById(id: string): DomainMeta | undefined {
  return DOMAINS.find((d) => d.id === id);
}

export function poolFor(domainId: string): EventCard[] {
  if (domainId === "mortal") return MORTAL_POOL;
  if (domainId === "hydro") return HYDRO_POOL;
  if (domainId === "night") return NIGHT_POOL;
  return [];
}

export function createRun(domainId: string, seed = `${Date.now()}`): LifeRun {
  if (domainId === "mortal") return createMortalRun(seed);
  if (domainId === "hydro") return createHydroRun(seed);
  if (domainId === "night") return createNightRun(seed);
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

export function resolveCard(domainId: string, id: string, run: LifeRun): EventCard | null {
  const pool = poolFor(domainId);
  const found = pool.find((c) => c.id === id);
  if (found) return found;
  void run;
  return null;
}

export function blankStatsFromMeta(meta: DomainMeta): StatMap {
  const s: StatMap = {};
  for (const st of meta.stats) s[st.key] = 50;
  return s;
}
