/** 把裸数字 / 短代号收成可读句子，避免时间线出现「3」这种谜语 */

export function formatChampLabel(id: string): string {
  if (id === "5p" || id === "6") return "本赛季冠军 5 座以上";
  const n = Number(id);
  if (!Number.isNaN(n)) {
    if (n === 0) return "本赛季无冠（颗粒无收）";
    return `本赛季冠军 ×${n}`;
  }
  return id;
}

export function formatReinforceCount(id: string): string {
  if (id === "5") return "补强 5 人（管理层疯了）";
  const n = Number(id);
  if (!Number.isNaN(n)) return `补强 ${n} 人`;
  return id;
}

export function formatPerfGrade(grade: string, who: "hero" | "mate"): string {
  const whoLabel = who === "hero" ? "主角" : "队友";
  const map: Record<string, string> = {
    S: `${whoLabel}发挥 S（神勇）`,
    A: `${whoLabel}发挥 A（出色）`,
    B: `${whoLabel}发挥 B（正常）`,
    C: `${whoLabel}发挥 C（低迷）`,
    D: `${whoLabel}发挥 D（崩盘）`,
  };
  return map[grade] || `${whoLabel}发挥 ${grade}`;
}

export function formatMajorStage(id: string): string {
  const map: Record<string, string> = {
    final: "杀入决赛",
    sf: "止步四强",
    qf: "止步八强",
    s3: "止步 Stage 3",
    s2: "止步 Stage 2",
    s1: "止步 Stage 1",
    mrq: "梦碎 MRQ",
  };
  return map[id] || id;
}

export function humanizePick(eventId: string, optId: string, optLabel: string): string {
  if (eventId === "champ_count") return formatChampLabel(optId);
  if (eventId === "reinforce_count") return formatReinforceCount(optId);
  if (eventId === "half_hero") return formatPerfGrade(optId, "hero");
  if (eventId === "half_teammate") return formatPerfGrade(optId, "mate");
  if (eventId === "major_result") return formatMajorStage(optId);
  if (eventId === "transfer") {
    return optId === "yes" ? "决定转会" : "留在原队";
  }
  if (eventId === "girlfriend") {
    return optId === "yes" ? "脱单成功" : "暂时专注事业";
  }
  if (eventId === "worldline_shiro") {
    return optId === "yes" ? "世界线：sh1ro 出走" : "世界线：sh1ro 留下";
  }
  if (eventId === "intl_squad" || optLabel === "是" || optLabel === "否") {
    // caller may pass phase context
  }
  // 已是完整句子则原样
  if (optLabel.length >= 4 && !/^\d+$/.test(optLabel)) return optLabel;
  if (/^\d+$/.test(optLabel)) return `结果：${optLabel}`;
  return optLabel;
}

export function regionKeyFromLabel(label?: string): string {
  const m: Record<string, string> = {
    独联体: "cis",
    欧洲: "eu",
    北美: "na",
    南美: "sa",
    亚洲: "asia",
    大洋洲: "oce",
    cis: "cis",
    eu: "eu",
    na: "na",
    sa: "sa",
    asia: "asia",
    oce: "oce",
  };
  return m[label || ""] || "eu";
}

export const REGION_LABEL: Record<string, string> = {
  cis: "独联体",
  eu: "欧洲",
  na: "北美",
  sa: "南美",
  asia: "亚洲",
  oce: "大洋洲",
};
