/**
 * 考据向示意库（公开赛果/常识整理，非 HLTV 实时爬取）。
 * 用途：事件文案、对手池、Major 名；权重仍由模拟引擎自适应。
 */

export type MajorRecord = {
  year: number;
  name: string;
  winner: string;
  runnerUp: string;
  note: string;
};

/** CS2 时代公开 Major（截至整理时） */
export const MAJOR_LORE: MajorRecord[] = [
  {
    year: 2024,
    name: "PGL Major Copenhagen 2024",
    winner: "NAVI",
    runnerUp: "FaZe",
    note: "CS2 首个 Major；jL MVP",
  },
  {
    year: 2024,
    name: "Perfect World Shanghai Major 2024",
    winner: "Spirit",
    runnerUp: "FaZe",
    note: "donk MVP；sh1ro / magixx / chopper 阵容",
  },
  {
    year: 2025,
    name: "BLAST.tv Austin Major 2025",
    winner: "Vitality",
    runnerUp: "The MongolZ",
    note: "ZywOo MVP；Vitality 翻盘夺冠",
  },
  {
    year: 2025,
    name: "StarLadder Budapest Major 2025",
    winner: "Vitality",
    runnerUp: "FaZe",
    note: "背靠背 Major；ropz Overpass 高光",
  },
];

export const MAP_POOL = [
  { id: "nuke", label: "核子危机", en: "Nuke" },
  { id: "mirage", label: "荒漠迷城", en: "Mirage" },
  { id: "inferno", label: "炼狱小镇", en: "Inferno" },
  { id: "dust2", label: "沙城Ⅱ", en: "Dust2" },
  { id: "ancient", label: "远古遗迹", en: "Ancient" },
  { id: "anubis", label: "阿努比斯", en: "Anubis" },
  { id: "train", label: "列车停放站", en: "Train" },
  { id: "overpass", label: "死亡游乐园", en: "Overpass" },
];

export const FINAL_OPPONENTS = [
  { id: "vitality", label: "王朝 Vitality", weight: 22 },
  { id: "spirit", label: "Spirit", weight: 16 },
  { id: "mouz", label: "MOUZ", weight: 12 },
  { id: "faze", label: "FaZe", weight: 14 },
  { id: "mongolz", label: "The MongolZ", weight: 12 },
  { id: "navi", label: "NAVI", weight: 12 },
  { id: "furia", label: "FURIA", weight: 8 },
  { id: "pain", label: "paiN", weight: 4 },
];

/** 示意补强池（CIS 语境常见 ID，非实时转会名单） */
export const REINFORCE_POOL_CIS = [
  "degster",
  "ArtFr0st",
  "Hobbit",
  "tN1R",
  "danistzz",
  "KaiR0N-",
  "FL1T",
  "zweih",
];

export const STAR_PLAYERS: Record<string, { team: string; note: string }> = {
  donk: { team: "Spirit", note: "超级新星步枪；Shanghai Major MVP" },
  sh1ro: { team: "Spirit", note: "顶级 AWP；世界线事件常用主角" },
  zywoo: { team: "Vitality", note: "多年级神；Austin/Budapest 高光" },
  ropz: { team: "Vitality", note: "CS2 多次 Major 决赛常客" },
  apex: { team: "Vitality", note: "IGL；指挥对位梗常用" },
  boombl4: { team: "示意", note: "经典 IGL 对位梗素材" },
  monesy: { team: "示意", note: "AWP 天才线" },
};

export function majorForYear(year: number): MajorRecord {
  const hits = MAJOR_LORE.filter((m) => m.year === year);
  if (hits.length) return hits[hits.length - 1];
  // 未来/过去年份：合成示意名
  const cities = ["Cologne", "Rio", "Paris", "Stockholm", "Berlin", "Katowice"];
  const city = cities[year % cities.length];
  return {
    year,
    name: `${city} Major ${year}（示意）`,
    winner: "TBD",
    runnerUp: "TBD",
    note: "赛程示意，非官方赛历",
  };
}
