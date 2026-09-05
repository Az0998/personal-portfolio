import { recommendReliability } from "./compute";
import type { WaterBalanceInput, WaterBalanceResult } from "./types";

const DISCLAIMER =
  "【演示稿】本章节结构参考常见水资源论证报告的简化骨架（项目概况—水源与保证率—需水—水平衡—合理性—结论），不是法定文本，不能替代正式论证、评审或行政许可。定额、系列与影响评价需按项目资料另编。";

function u(input: WaterBalanceInput) {
  return input.unit;
}

function line(input: WaterBalanceInput, result: WaterBalanceResult) {
  const rows = input.demands
    .filter((d) => d.volume > 0 || d.name)
    .map((d) => `| ${d.name} | ${fmt(d.volume)} | ${d.note || "—"} |`)
    .join("\n");
  return { rows, unit: u(input), result };
}

export function buildMarkdown(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const { rows, unit } = line(input, result);
  const closeTxt = result.closed
    ? `闭合差 ${fmt(result.residual)} ${unit}，可视为基本闭合。`
    : `闭合差 ${fmt(result.residual)} ${unit}，尚未闭合。`;

  return `# ${input.projectName || "（未命名项目）"}水资源论证 / 水平衡报告（简化演示）

> ${DISCLAIMER}

## 1 项目概况

- 项目名称：${input.projectName || "—"}
- 建设地点：${input.location || "—"}
- 业主单位：${input.owner || "—"}
- 行业/用途：${input.industry || "—"}
- 编制年份：${input.year}　水平年：${input.horizonYear}

本报告仅对取用水规模与水平衡作室内演算，用于信息化交付演示。

## 2 取水水源与保证率

- 取水水源：${input.sourceName || "—"}（${input.sourceType}）
- 设计保证率：${input.reliability}%
- 口径提示：${recommendReliability(input.industry)}

在 ${input.reliability}% 保证率条件下，拟定年取水量 **${fmt(input.withdrawal)} ${unit}**。

## 3 需水结构

单位：${unit}

| 用水户 | 需水量 | 备注 |
|--------|--------|------|
${rows || "| — | — | — |"}
| **合计** | **${fmt(result.demandTotal)}** | 表内合计 |

## 4 水平衡分析

单位：${unit}

| 项目 | 数量 | 占取水比例 |
|------|------|------------|
| 取水量 | ${fmt(input.withdrawal)} | 100% |
| 需水合计 | ${fmt(result.demandTotal)} | ${pct(result.demandTotal, input.withdrawal)} |
| 损耗（管网/未计量等） | ${fmt(input.loss)} | ${fmt(result.lossRate)}% |
| 退水量 | ${fmt(input.returnWater)} | ${fmt(result.returnRate)}% |
| 耗水量（取水−退水） | ${fmt(result.consume)} | ${fmt(result.consumeRate)}% |
| 闭合差（取水−需水−损耗） | ${fmt(result.residual)} | — |

平衡关系（简化）：**取水量 ≈ 需水合计 + 损耗**；**耗水量 = 取水量 − 退水量**。${closeTxt}

## 5 取用水合理性简述

${buildRationality(input, result).join("\n\n")}

## 6 结论与建议

1. ${input.horizonYear} 水平年拟定取水 ${fmt(input.withdrawal)} ${unit}，退水 ${fmt(input.returnWater)} ${unit}，耗水 ${fmt(result.consume)} ${unit}。
2. ${result.closed ? "水平衡基本闭合，可作为室内讨论底稿。" : "建议先消化闭合差，再写入正式章节。"}
3. 正式论证尚需补充水文系列、定额依据、节水评价、退水水质与水生态影响等专章。

---
生成时间：${new Date().toLocaleString("zh-CN")} · 智慧水利 · 水平衡报告生成器演示
`;
}

export function buildRationality(input: WaterBalanceInput, result: WaterBalanceResult): string[] {
  const paras: string[] = [];
  paras.push(
    `本项目属「${input.industry || "综合取用水"}」，水源为${input.sourceType}${input.sourceName ? `（${input.sourceName}）` : ""}，按 ${input.reliability}% 保证率配置取水规模。${recommendReliability(input.industry)}`
  );

  if (input.withdrawal > 0) {
    paras.push(
      `需水合计 ${fmt(result.demandTotal)} ${u(input)}，占取水 ${pct(result.demandTotal, input.withdrawal)}；损耗 ${fmt(input.loss)} ${u(input)}（${fmt(result.lossRate)}%）。` +
        (result.closed
          ? "取水与「需水+损耗」匹配较好，规模上未见明显超额取水。"
          : result.residual > 0
            ? `尚有 ${fmt(result.residual)} ${u(input)} 未分解，建议归入未预见损失、备用或复核定额。`
            : `缺口 ${fmt(-result.residual)} ${u(input)}，需压缩需水、提高重复利用率或调整取水规模。`)
    );
    paras.push(
      `退水率 ${fmt(result.returnRate)}%，耗水率 ${fmt(result.consumeRate)}%。` +
        (result.returnRate >= 25 && result.returnRate <= 55
          ? "退水比例处于一般工业/综合供水常见区间，后续应以水质和受纳水体论证为准。"
          : result.returnRate < 15
            ? "退水比例偏低，若为高耗水或封闭循环工艺需在报告中说明；若漏计退水应补全。"
            : "退水比例偏高，应说明循环水、间接冷却或生活排水构成，避免与耗水口径冲突。")
    );
  }

  const eco = input.demands.find((d) => d.name.includes("生态"));
  if (eco && eco.volume > 0 && input.withdrawal > 0) {
    paras.push(
      `生态用水 ${fmt(eco.volume)} ${u(input)}，约占取水 ${pct(eco.volume, input.withdrawal)}。演示稿仅作结构占位，正式论证需对接河道内生态流量要求。`
    );
  }

  result.flags.forEach((f) => paras.push(`注意：${f}`));
  return paras;
}

export function buildWordHtml(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const md = buildMarkdown(input, result);
  const body = markdownLiteToHtml(md);
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.projectName || "水平衡报告")}</title>
<style>
  body { font-family: "宋体", SimSun, serif; font-size: 12pt; line-height: 1.6; color: #222; }
  h1 { font-size: 18pt; text-align: center; }
  h2 { font-size: 14pt; margin-top: 18pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
  th, td { border: 1px solid #333; padding: 6pt 8pt; }
  th { background: #f3f3f3; }
  blockquote { color: #555; border-left: 3pt solid #888; padding-left: 8pt; }
</style>
</head>
<body>${body}</body>
</html>`;
}

function markdownLiteToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!/^[-: ]+$/.test(cells.join(""))) rows.push(cells);
        i += 1;
      }
      out.push("<table>");
      rows.forEach((r, ri) => {
        const tag = ri === 0 ? "th" : "td";
        out.push("<tr>" + r.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>");
      });
      out.push("</table>");
      continue;
    }
    if (line.startsWith("# ")) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith("## ")) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("> ")) out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if (line.startsWith("- ")) out.push(`<p>${inline(line.slice(2))}</p>`);
    else if (/^\d+\. /.test(line)) out.push(`<p>${inline(line.replace(/^\d+\. /, ""))}</p>`);
    else if (line.startsWith("---")) out.push("<hr />");
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    i += 1;
  }
  return out.join("\n");
}

function inline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function pct(part: number, whole: number) {
  if (!whole) return "—";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
