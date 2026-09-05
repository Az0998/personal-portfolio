import { recommendReliability } from "./compute";
import { DOC_VERSION, fileBase } from "./project-io";
import { qcConfigNote } from "./qc";
import type { QcReport, WaterBalanceInput, WaterBalanceResult } from "./types";

const DISCLAIMER =
  "【演示草稿 · 非正式论证】本章节只演示常见水资源论证报告的简化骨架，不是法定文本，不能替代正式论证、评审或取水许可。定额、水文系列、影响评价须按项目资料另编。";

function u(input: WaterBalanceInput) {
  return input.unit;
}

function reliabilityText(input: WaterBalanceInput) {
  return input.reliability == null ? "未选定" : `${input.reliability}%`;
}

function closeLine(input: WaterBalanceInput, result: WaterBalanceResult): string {
  if (result.status === "idle") {
    return `在给定输入下，尚未形成可判断的水量，不作闭合结论。Δ = ${fmt(result.residual)} ${u(input)}。`;
  }
  if (result.status === "closed") {
    return `在给定输入下，Δ = ${fmt(result.residual)} ${u(input)}，仅说明表内算术在显示精度内为零，不构成审批依据。`;
  }
  return `在给定输入下，Δ = ${fmt(result.residual)} ${u(input)}，未闭合，正文不得称「水平衡闭合」。`;
}

function demandShareRows(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const rows = input.demands
    .filter((d) => d.volume > 0 || d.name)
    .map((d) => {
      const share = result.demandTotal > 0 ? pct(d.volume, result.demandTotal) : "—";
      return `| ${d.name || "—"} | ${fmt(d.volume)} | ${share} | ${d.note || "—"} |`;
    })
    .join("\n");
  return rows || "| — | — | — | — |";
}

export function buildDemandShareTable(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const unit = u(input);
  return `单位：${unit}

| 用水户 | 需水量 | 占需水合计 | 备注 |
|--------|--------|------------|------|
${demandShareRows(input, result)}
| **合计 D** | **${fmt(result.demandTotal)}** | **100%** | 分项之和 ${fmt(result.demandChecksum)}，差 ${fmt(result.demandGap)} |`;
}

export function buildBalanceTable(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const unit = u(input);
  return `单位：${unit}

| 项目 | 数量 | 占取水 |
|------|------|--------|
| 取水量 Q | ${fmt(input.withdrawal)} | 100% |
| 需水合计 D | ${fmt(result.demandTotal)} | ${pct(result.demandTotal, input.withdrawal)} |
| 管网/未计量损失 L | ${fmt(input.loss)} | ${fmt(result.lossRate)}% |
| 退水量 R | ${fmt(input.returnWater)} | ${fmt(result.returnRate)}% |
| 耗水量 C = Q − R | ${fmt(result.consume)} | ${fmt(result.consumeRate)}% |
| 平衡差 Δ = Q − (D + L) | ${fmt(result.residual)} | ${result.status === "closed" ? "精度内为零" : result.status === "idle" ? "待计算" : "非零"} |`;
}

function demandComment(input: WaterBalanceInput, result: WaterBalanceResult): string {
  const industry = input.industry || "综合取用水";
  if (result.demandTotal <= 0) {
    return `在给定行业描述「${industry}」下，需水合计尚为 0，还不能评述分项结构。建议先补齐用水户后再对照定额。`;
  }
  const parts = input.demands
    .filter((d) => d.volume > 0)
    .map((d) => `${d.name || "未命名"}约占需水 ${pct(d.volume, result.demandTotal)}`);
  const lead = parts.length
    ? `在给定行业描述「${industry}」下，${parts.slice(0, 4).join("，")}。`
    : `在给定行业描述「${industry}」下，已列出用水户但水量均为 0。`;
  return `${lead}该结构可作室内讨论的出发点数，是否与定额、重复利用率和实际用水户清单相符，仍须用项目资料复核，不能据此写成取用水已经合理。`;
}

function conclusionItems(input: WaterBalanceInput, result: WaterBalanceResult, qc: QcReport): string[] {
  const unit = u(input);
  const items = [
    `在给定输入下，${input.horizonYear || "—"} 水平年拟定取水 ${fmt(input.withdrawal)} ${unit}，退水 ${fmt(input.returnWater)} ${unit}，耗水 ${fmt(result.consume)} ${unit}。`,
    closeLine(input, result),
  ];
  if (qc.hardCount > 0) {
    items.push(
      `当前存在 ${qc.hardCount} 条硬校验，按本工具质控规则不应作为可外发底稿。建议按侧栏规则修改取用水或保证率后再导出。`
    );
  } else if (qc.softCount > 0) {
    items.push(
      `硬校验已通过；另有 ${qc.softCount} 条软校验（经验区间，非正式）。建议在正文中交代偏差原因，勿写成必然可批。`
    );
  } else {
    items.push("在给定输入下，硬校验与软校验均未触发。这只说明未触发表内经验规则，不等于论证充分或将被批准。");
  }
  items.push(
    "建议补充：水文系列与可供水量、用水定额依据、节水评价、退水水质与受纳水体、河道内生态流量或地下水禁限采等专章后，再进入正式论证。"
  );
  return items;
}

export type ExportOpts = {
  generatedAt?: string;
  draftOverride?: boolean;
};

function meta(input: WaterBalanceInput, qc: QcReport, opts?: ExportOpts) {
  const generatedAt = opts?.generatedAt ?? "与预览同源";
  const base = fileBase(input);
  const draft = opts?.draftOverride ?? !qc.canExport;
  return {
    generatedAt,
    base,
    filenameMd: `${base}.md`,
    filenameDoc: `${base}.doc`,
    version: DOC_VERSION,
    draft,
    unit: u(input),
    footer: `${base} · v${DOC_VERSION} · 由张森捷作品集工具生成`,
  };
}

function coverMarkdown(input: WaterBalanceInput, qc: QcReport, opts?: ExportOpts): string {
  const m = meta(input, qc, opts);
  const stamp = m.draft ? "演示非正式 · 质控未通过草稿" : "演示非正式";
  return `# 封面

**水资源论证 / 水平衡报告**

（简化演示稿 · 非正式论证）

- 项目名称：${input.projectName || "（未命名项目）"}
- 建设地点：${input.location || "—"}
- 业主单位：${input.owner || "—"}
- 行业 / 用途：${input.industry || "—"}
- 基准年 / 水平年：${input.year || "—"} / ${input.horizonYear || "—"}
- 生成日期：${m.generatedAt}
- 文件名：${m.filenameMd}
- 版本：v${m.version}
- 声明：**${stamp}**。不得作为行政许可、评审申报或对外正式件。

> ${DISCLAIMER}
`;
}

function footerMarkdown(input: WaterBalanceInput, qc: QcReport, opts?: ExportOpts): string {
  const m = meta(input, qc, opts);
  return `---

*单位脚注：正文水量单位均为 ${m.unit}。年日换算按 365 日，1 万m³/a = 10000/365 ≈ 27.40 m³/d。*

*${m.footer}*
`;
}

function chaptersMarkdown(input: WaterBalanceInput, result: WaterBalanceResult, qc: QcReport): string {
  const unit = u(input);
  const demandTable = buildDemandShareTable(input, result);
  const balanceTable = buildBalanceTable(input, result);
  const conclusions = conclusionItems(input, result, qc)
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");
  const qcLines =
    qc.findings.length === 0
      ? "- 质控：硬校验、软校验均未触发（规则见 `rules.json`，经验区间仅供示意）。"
      : qc.findings
          .map((f) => `- ${f.level === "hard" ? "硬校验" : "软校验"}｜${f.name}：${f.detail} 建议：${f.advice}`)
          .join("\n");

  return `# ${input.projectName || "（未命名项目）"}水资源论证 / 水平衡报告（简化演示）

## 1 项目概况

- 项目名称：${input.projectName || "—"}
- 建设地点：${input.location || "—"}
- 业主单位：${input.owner || "—"}
- 行业 / 用途：${input.industry || "—"}
- 基准年（编制年）：${input.year || "—"}
- 水平年：${input.horizonYear || "—"}

本页只对用户填入的取用水规模作室内演算，用于信息化交付演示。

## 2 水源与取退水方案

- 取水水源：${input.sourceName || "—"}（${input.sourceType}）
- 设计保证率：${reliabilityText(input)}
- 口径提示：${recommendReliability(input.industry)}
- 取水量 Q：${fmt(input.withdrawal)} ${unit}
- 退水量 R：${fmt(input.returnWater)} ${unit}
- 耗水量 C = Q − R：${fmt(result.consume)} ${unit}

在给定保证率与水源类型下，上列取退水为输入方案，不是已批复规模。

## 3 需水结构与合理性简述

${demandTable}

${demandComment(input, result)}

## 4 水平衡表

${balanceTable}

主口径（演示）：**D = Σ 分项**；**C = Q − R**（不用工艺耗水）；**Δ = Q − (D + L)**。退水不进入 Δ。${closeLine(input, result)}

## 5 结论与建议

${conclusions}

## 6 数据与局限

- 数据来源：本页用户输入，未经监测序列或批复文件核验。
- 未做流域 / 区域水资源供需分析，未做水源可供水量与用水总量控制指标校核。
- 未做河道内生态流量、地下水禁限采、水质与水生态影响评价。
- 质控说明：${qcConfigNote()}
${qcLines}
`;
}

export function buildMarkdown(
  input: WaterBalanceInput,
  result: WaterBalanceResult,
  qc: QcReport,
  opts?: ExportOpts
): string {
  return `${coverMarkdown(input, qc, opts)}
${chaptersMarkdown(input, result, qc)}
${footerMarkdown(input, qc, opts)}`;
}

export function buildWordHtml(
  input: WaterBalanceInput,
  result: WaterBalanceResult,
  qc: QcReport,
  opts?: ExportOpts
): string {
  return buildWordDocument(input, result, qc, opts);
}

export function buildWordHtmlFromMarkdown(
  title: string,
  md: string,
  extras?: { header?: string; footer?: string }
): string {
  const body = markdownLiteToHtml(md);
  return wrapWordHtml(title, body, extras);
}

export function buildWordDocument(
  input: WaterBalanceInput,
  result: WaterBalanceResult,
  qc: QcReport,
  opts?: ExportOpts
): string {
  const m = meta(input, qc, opts);
  const stamp = m.draft ? "演示非正式 · 质控未通过草稿" : "演示非正式";
  const cover = `<div class="cover">
  <p class="stamp">${escapeHtml(stamp)}</p>
  <p class="kicker">室内岗 · 智慧水利作品集</p>
  <h1>水资源论证 / 水平衡报告</h1>
  <p class="sub">简化演示稿 · 非正式论证</p>
  <p class="project">${escapeHtml(input.projectName || "（未命名项目）")}</p>
  <table class="cover-meta">
    <tr><td>建设地点</td><td>${escapeHtml(input.location || "—")}</td></tr>
    <tr><td>业主单位</td><td>${escapeHtml(input.owner || "—")}</td></tr>
    <tr><td>行业 / 用途</td><td>${escapeHtml(input.industry || "—")}</td></tr>
    <tr><td>基准年 / 水平年</td><td>${escapeHtml(String(input.year || "—"))} / ${escapeHtml(String(input.horizonYear || "—"))}</td></tr>
    <tr><td>生成日期</td><td>${escapeHtml(m.generatedAt)}</td></tr>
    <tr><td>文件 / 版本</td><td>${escapeHtml(m.filenameDoc)} · v${m.version}</td></tr>
  </table>
  <p class="cover-note">${escapeHtml(DISCLAIMER)}</p>
</div>`;
  const body = markdownLiteToHtml(chaptersMarkdown(input, result, qc));
  const notes = `<p class="fn">单位脚注：正文水量单位均为 ${escapeHtml(m.unit)}。年日换算按 365 日，1 万m³/a = 10000/365 ≈ 27.40 m³/d。</p>`;
  return wrapWordHtml(input.projectName || "水平衡报告", cover + body + notes, {
    header: "演示草稿 · 非正式论证 · 不得作为行政许可材料",
    footer: m.footer,
  });
}

function wrapWordHtml(
  title: string,
  inner: string,
  extras?: { header?: string; footer?: string }
): string {
  const header = extras?.header || "演示草稿 · 非正式论证";
  const footer = extras?.footer || `v${DOC_VERSION} · 由张森捷作品集工具生成`;
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
</w:WordDocument>
</xml><![endif]-->
<style>
  @page Section1 {
    size: 595.3pt 841.9pt;
    margin: 2.4cm 2.3cm 2.2cm 2.6cm;
    mso-header: h1;
    mso-footer: f1;
    mso-header-margin: 1.15cm;
    mso-footer-margin: 1.15cm;
  }
  div.Section1 { page: Section1; }
  body { font-family: "宋体", SimSun, "Times New Roman", serif; font-size: 12pt; line-height: 1.65; color: #222; }
  h1 { font-family: "黑体", SimHei, sans-serif; font-size: 18pt; text-align: center; font-weight: normal; }
  h2 { font-family: "黑体", SimHei, sans-serif; font-size: 14pt; margin: 16pt 0 8pt; font-weight: normal; }
  h3 { font-family: "楷体", KaiTi, serif; font-size: 12pt; margin: 12pt 0 6pt; }
  p { margin: 0 0 8pt; }
  blockquote { color: #555; border-left: 3pt solid #888; padding-left: 8pt; margin: 8pt 0 12pt; }
  table.three-line { border-collapse: collapse; width: 100%; margin: 8pt 0 4pt; }
  table.three-line th, table.three-line td { border: none; border-bottom: 0.5pt solid #333; padding: 4pt 6pt; text-align: left; }
  table.three-line thead th { border-top: 1.5pt solid #111; border-bottom: 0.75pt solid #111; font-family: "黑体", SimHei, sans-serif; font-weight: normal; }
  table.three-line tbody tr:last-child td { border-bottom: 1.5pt solid #111; }
  p.fn { font-size: 9pt; color: #555; margin: 0 0 10pt; }
  p.MsoHeader, p.MsoFooter { font-size: 9pt; color: #666; font-family: "宋体", SimSun, serif; }
  .cover { text-align: center; page-break-after: always; padding-top: 36pt; }
  .cover .kicker { letter-spacing: 0.2em; font-size: 10.5pt; color: #555; }
  .cover .sub { font-size: 12pt; color: #444; margin-bottom: 18pt; }
  .cover .project { font-family: "黑体", SimHei, sans-serif; font-size: 16pt; margin: 18pt 0; }
  .cover .stamp { display: inline-block; border: 1.5pt solid #b45309; color: #b45309; padding: 3pt 14pt; margin-bottom: 18pt; letter-spacing: 0.18em; }
  table.cover-meta { width: 78%; margin: 18pt auto; border-collapse: collapse; text-align: left; }
  table.cover-meta td { padding: 4pt 6pt; border-bottom: 0.5pt solid #ccc; }
  table.cover-meta td:first-child { width: 28%; color: #555; }
  .cover-note { font-size: 10.5pt; color: #555; text-align: left; margin: 24pt 28pt 0; }
</style>
</head>
<body>
<div class="Section1">
  <div style="mso-element:header" id="h1"><p class="MsoHeader">${escapeHtml(header)}</p></div>
  <div style="mso-element:footer" id="f1"><p class="MsoFooter">${escapeHtml(footer)}</p></div>
  ${inner}
</div>
</body>
</html>`;
}

export function markdownLiteToHtml(md: string): string {
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
      out.push('<table class="three-line">');
      rows.forEach((r, ri) => {
        if (ri === 0) {
          out.push(
            "<thead><tr>" +
              r.map((c) => `<th>${inline(c)}</th>`).join("") +
              "</tr></thead><tbody>"
          );
        } else {
          out.push("<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
        }
      });
      out.push("</tbody></table>");
      continue;
    }
    if (line.startsWith("# ")) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith("## ")) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("### ")) out.push(`<h3>${inline(line.slice(4))}</h3>`);
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
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
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

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
