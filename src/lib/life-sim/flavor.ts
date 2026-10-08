import type { LifeRun } from "./types";
import type { PlayerState } from "@/lib/cs-life/types";

/** 氛围句：让界面不只是数值面板 */

const CS_ATMOS: { test: (p: PlayerState) => boolean; line: string }[] = [
  { test: (p) => p.judges.form >= 80, line: "枪口有风。这个赛季，世界似乎慢半拍。" },
  { test: (p) => p.stats.mentality < 40, line: "耳机里的呼吸声比脚步声更响。" },
  { test: (p) => p.judges.fame >= 75, line: "你走在场馆走廊，有人已经提前举起手机。" },
  { test: (p) => Boolean(p.hasPartner), line: "赛后第一个消息，不一定来自教练。" },
  {
    test: (p) => p.events.some((e) => /替补|bench/i.test(e.title + e.detail)),
    line: "替补席的塑料椅，比你想的要硬。",
  },
  { test: () => true, line: "转盘未停，故事未完。把命运交给下一扇区。" },
];

export function csAtmosphere(p: PlayerState): string {
  for (const a of CS_ATMOS) {
    if (a.test(p)) return a.line;
  }
  return CS_ATMOS[CS_ATMOS.length - 1].line;
}

export function lifeAtmosphere(run: LifeRun): string {
  const spr = run.stats.spr ?? run.stats.mood ?? 50;
  const money = run.stats.money ?? run.stats.coin ?? 50;
  if (run.flags.includes("peaceful")) return "茶凉了又续上。日子慢，心不慢。";
  if (run.flags.includes("crisis") || spr < 35) return "有些门关了，走廊却还很长。";
  if (run.flags.includes("flood_hero")) return "雨停之后，报汛的短信还停在置顶。";
  if (money >= 80) return "口袋轻了，选择反而变多了。";
  if (run.age < 12) return "世界很大，鞋带总是松开。";
  if (run.age > 60) return "回忆比日历厚，笑话比药甜。";
  return "年龄往前走，选项在身后留下脚印。";
}

/** 队列预告短标题 */
export function previewQueueTitles(titles: string[], max = 3): string {
  if (!titles.length) return "本季事件将在推进后生成";
  const head = titles.slice(0, max);
  const more = titles.length > max ? ` · +${titles.length - max}` : "";
  return head.join(" → ") + more;
}
