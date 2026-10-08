/**
 * Curated CS career catalog (schematic, HLTV-inspired).
 * Not scraped live — avoid ToS issues; weights tuned for a fun demo.
 */
import type { Grade, SixKey, SixStats, WheelOption } from "./types";
import { withColors } from "./wheel";

export const SIX_LABELS: Record<SixKey, string> = {
  aim: "瞄准",
  utility: "道具",
  sense: "游戏理解",
  mentality: "心态",
  attitude: "职业态度",
  leadership: "指挥",
};

export const GRADE_SCORE: Record<Grade, number> = {
  "S+": 96,
  S: 88,
  A: 78,
  B: 68,
  C: 55,
  D: 42,
  E: 28,
};

export const REGION_OPTIONS = withColors([
  { id: "cis", label: "独联体", weight: 28 },
  { id: "eu", label: "欧洲", weight: 24 },
  { id: "na", label: "北美", weight: 14 },
  { id: "sa", label: "南美", weight: 12 },
  { id: "asia", label: "亚洲", weight: 12 },
  { id: "oce", label: "大洋洲", weight: 10 },
]);

export const COUNTRY_BY_REGION: Record<string, Omit<WheelOption, "color">[]> = {
  cis: [
    { id: "ru", label: "俄罗斯", weight: 48 },
    { id: "ua", label: "乌克兰", weight: 28 },
    { id: "kz", label: "哈萨克斯坦", weight: 12 },
    { id: "by", label: "白俄罗斯", weight: 7 },
    { id: "uz", label: "乌兹别克斯坦", weight: 3 },
    { id: "tj", label: "塔吉克斯坦", weight: 2 },
  ],
  eu: [
    { id: "dk", label: "丹麦", weight: 18 },
    { id: "se", label: "瑞典", weight: 14 },
    { id: "fr", label: "法国", weight: 14 },
    { id: "pl", label: "波兰", weight: 12 },
    { id: "de", label: "德国", weight: 10 },
    { id: "fi", label: "芬兰", weight: 8 },
    { id: "no", label: "挪威", weight: 6 },
    { id: "uk", label: "英国", weight: 6 },
    { id: "hu", label: "匈牙利", weight: 6 },
    { id: "rs", label: "塞尔维亚", weight: 6 },
  ],
  na: [
    { id: "us", label: "美国", weight: 62 },
    { id: "ca", label: "加拿大", weight: 38 },
  ],
  sa: [
    { id: "br", label: "巴西", weight: 72 },
    { id: "ar", label: "阿根廷", weight: 16 },
    { id: "uy", label: "乌拉圭", weight: 12 },
  ],
  asia: [
    { id: "cn", label: "中国", weight: 28 },
    { id: "mn", label: "蒙古", weight: 22 },
    { id: "jp", label: "日本", weight: 12 },
    { id: "kr", label: "韩国", weight: 10 },
    { id: "tr", label: "土耳其", weight: 16 },
    { id: "il", label: "以色列", weight: 12 },
  ],
  oce: [
    { id: "au", label: "澳大利亚", weight: 78 },
    { id: "nz", label: "新西兰", weight: 22 },
  ],
};

export const BIRTH_ERA = withColors([
  { id: "pre90", label: "1990 年以前", weight: 6 },
  { id: "90_95", label: "1990 ~ 1995", weight: 10 },
  { id: "95_00", label: "1995 ~ 2000", weight: 16 },
  { id: "00_05", label: "2000 ~ 2005", weight: 32 },
  { id: "05_10", label: "2005 ~ 2010", weight: 24 },
  { id: "post10", label: "2010 以后", weight: 12 },
]);

export const MOTIVATION = withColors([
  { id: "love", label: "热爱使然，享受游戏", weight: 22 },
  { id: "poor", label: "家境窘迫，背水一战", weight: 18 },
  { id: "money", label: "赚取财富，享受生活", weight: 18 },
  { id: "talent", label: "物尽其用，珍惜天赋", weight: 20 },
  { id: "legacy", label: "雁过留声，人过留名", weight: 22 },
]);

export const ROLE_CT = withColors([
  { id: "anchor_a", label: "大区主防", weight: 22 },
  { id: "anchor_b", label: "小区主防", weight: 20 },
  { id: "roto_b", label: "控图/小区协防", weight: 20 },
  { id: "roto_a", label: "控图/大区协防", weight: 20 },
  { id: "awp", label: "狙击手", weight: 18 },
]);

export const ROLE_T = withColors([
  { id: "entry", label: "突破", weight: 22 },
  { id: "awp", label: "狙击手", weight: 18 },
  { id: "util", label: "道具", weight: 20 },
  { id: "trade", label: "补枪", weight: 20 },
  { id: "lurk", label: "自由人", weight: 20 },
]);

export const TEAMS_BY_REGION: Record<string, string[]> = {
  cis: ["Spirit", "Virtus.pro", "BetBoom", "Cloud9", "Nemiga", "9Pandas", "FORZE", "1WIN"],
  eu: ["Vitality", "G2", "MOUZ", "NaVi", "FaZe", "Astralis", "Heroic", "BIG", "fnatic"],
  na: ["Liquid", "Complexity", "M80", "Nouns", "NRG"],
  sa: ["FURIA", "Imperial", "paiN", "MIBR", "Fluxo"],
  asia: ["The MongolZ", "Lynn Vision", "TYLOO", "Rare Atom", "ATOX"],
  oce: ["FlyQuest", "Rooster", "Mindfreak"],
};

/** Schematic Major names by era — not live HLTV schedule. */
export const MAJOR_POOL = [
  "Major · Copenhagen",
  "Major · Shanghai",
  "Major · Paris",
  "Major · Rio",
  "Major · Antwerp",
  "Major · Stockholm",
  "Major · Berlin",
  "Major · Katowice (示意)",
];

export function debutYearOptions(birthEra: string): WheelOption[] {
  const map: Record<string, [number, number, number[]]> = {
    // [start, end, weightBiasTowardEnd]
    pre90: [2012, 2018, [2, 3, 4, 5, 6, 7, 6]],
    "90_95": [2013, 2020, [2, 3, 4, 5, 6, 7, 8, 7]],
    "95_00": [2015, 2022, [2, 3, 4, 5, 6, 8, 9, 8]],
    "00_05": [2018, 2025, [2, 3, 4, 6, 8, 10, 12, 10]],
    "05_10": [2020, 2026, [3, 5, 8, 10, 12, 14, 12]],
    post10: [2023, 2026, [6, 10, 14, 16]],
  };
  const [a, b] = map[birthEra] || [2018, 2025, []];
  const opts: Omit<WheelOption, "color">[] = [];
  for (let y = a; y <= b; y++) {
    const i = y - a;
    const w = map[birthEra]?.[2]?.[i] ?? 5 + i;
    opts.push({ id: String(y), label: String(y), weight: w });
  }
  return withColors(opts);
}

export function gradeOptions(
  key: SixKey,
  boostHigh = 0
): WheelOption[] {
  // Base rarity; boostHigh shifts mass toward S/A
  const base: { id: Grade; label: string; w: number }[] = [
    { id: "S+", label: key === "sense" ? "S+ (zywoo, ropz)" : key === "aim" ? "S+ (top1)" : "S+ (悬梁刺股)", w: 3 + boostHigh * 0.4 },
    { id: "S", label: key === "mentality" ? "S (自信开朗)" : key === "attitude" ? "S (天道酬勤)" : "S (高位 top)", w: 7 + boostHigh * 0.6 },
    { id: "A", label: key === "mentality" ? "A (积极认真)" : "A (中低位 top)", w: 16 + boostHigh * 0.3 },
    { id: "B", label: key === "sense" ? "B (一线)" : "B (普通一线)", w: 24 - boostHigh * 0.2 },
    { id: "C", label: "C (二线)", w: 22 - boostHigh * 0.3 },
    { id: "D", label: key === "mentality" ? "D (红温易怒)" : "D (三线)", w: 16 - boostHigh * 0.4 },
    { id: "E", label: key === "sense" ? "E (似乎没开智)" : key === "mentality" ? "E (团队炸弹)" : "E (未开智)", w: 12 - boostHigh * 0.5 },
  ];
  return withColors(
    base.map((b) => ({
      id: b.id,
      label: b.label,
      weight: Math.max(1, b.w),
      meta: { grade: b.id },
    }))
  );
}

export function blankStats(): SixStats {
  return { aim: 50, utility: 50, sense: 50, mentality: 50, attitude: 50, leadership: 50 };
}

export function teamsForRegion(region: string): WheelOption[] {
  const list = TEAMS_BY_REGION[region] || TEAMS_BY_REGION.eu;
  return withColors(list.map((t) => ({ id: t, label: t, weight: 1 })));
}
