"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CASES } from "@/lib/water-balance/cases";
import {
  UNIT_LABEL,
  checksumDemands,
  cloneInput,
  computeBalance,
  convertInputUnit,
  emptyInput,
  fmtSigned,
  newDemandRow,
  sampleInput,
  sumDemands,
} from "@/lib/water-balance/compute";
import { WORK_BLURB, WORK_TAGS } from "@/lib/water-balance/nav";
import { fileBase, parseProject, stringifyProject } from "@/lib/water-balance/project-io";
import { runQc } from "@/lib/water-balance/qc";
import {
  buildBalanceTable,
  buildMarkdown,
  buildWordDocument,
  copyText,
  downloadText,
  markdownLiteToHtml,
} from "@/lib/water-balance/report";
import type { VolumeUnit, WaterBalanceInput } from "@/lib/water-balance/types";

const KEY = "water-balance-report:v2";
const LEGACY_KEY = "water-balance-report:v1";

function normalize(raw: unknown): WaterBalanceInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<WaterBalanceInput>;
  const base = sampleInput();
  const demands = Array.isArray(o.demands) && o.demands.length
    ? o.demands.map((d, i) => ({
        id: String(d?.id || `d-${i}`),
        name: String(d?.name || ""),
        volume: Number(d?.volume) || 0,
        note: String(d?.note || ""),
      }))
    : base.demands;
  return {
    ...base,
    ...o,
    unit: o.unit === "m³/d" ? "m³/d" : "万m³/a",
    reliability:
      o.reliability === 75 || o.reliability === 90 || o.reliability === 95
        ? o.reliability
        : o.reliability == null
          ? null
          : 95,
    demands,
  };
}

function load(): WaterBalanceInput {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return sampleInput();
    return normalize(JSON.parse(raw)) ?? sampleInput();
  } catch {
    return sampleInput();
  }
}

function fmtVol(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function WaterBalanceApp() {
  const [input, setInput] = useState<WaterBalanceInput>(() => sampleInput());
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [unitTip, setUnitTip] = useState("");
  const [copyTip, setCopyTip] = useState("");
  const [pendingExport, setPendingExport] = useState<null | "md" | "doc">(null);
  const [ioTip, setIoTip] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(load());
    setRevision((n) => n + 1);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(input));
  }, [input, ready]);

  const result = useMemo(() => computeBalance(input), [input]);
  const qc = useMemo(() => runQc(input, result), [input, result]);
  const md = useMemo(() => buildMarkdown(input, result, qc), [input, result, qc]);
  const previewHtml = useMemo(() => markdownLiteToHtml(md), [md]);
  const balanceMd = useMemo(() => buildBalanceTable(input, result), [input, result]);

  const unit = UNIT_LABEL[input.unit];
  const rowSum = checksumDemands(input.demands);
  const demandTotal = sumDemands(input.demands);
  const tableGap = result.demandGap;
  const tableOk = Math.abs(tableGap) < 0.005;

  const patch = (p: Partial<WaterBalanceInput>) => setInput((s) => ({ ...s, ...p }));

  const replace = (next: WaterBalanceInput, tip = "") => {
    setInput(cloneInput(next));
    setRevision((n) => n + 1);
    setUnitTip(tip);
  };

  const setDemand = (id: string, field: "name" | "volume" | "note", value: string | number) => {
    setInput((s) => ({
      ...s,
      demands: s.demands.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    }));
  };

  const addDemand = () => {
    setInput((s) => ({ ...s, demands: [...s.demands, newDemandRow()] }));
  };

  const removeDemand = (id: string) => {
    setInput((s) => ({ ...s, demands: s.demands.filter((d) => d.id !== id) }));
  };

  const switchUnit = (to: VolumeUnit) => {
    if (input.unit === to) return;
    const next = convertInputUnit(input, to);
    replace(
      next,
      to === "m³/d"
        ? "已按 365 日/年换算为 m³/d（1 万m³/a = 10000/365 ≈ 27.40 m³/d）。四舍五入到 0.01，请复核取整。"
        : "已按 365 日/年换算为 万m³/a（m³/d × 365 / 10000）。四舍五入到 0.01，请复核取整。"
    );
  };

  const kpiResidualClass =
    result.status === "open" ? "is-bad" : result.status === "closed" ? "is-ok" : "is-idle";
  const residualLabel =
    result.status === "closed" ? "闭合" : result.status === "idle" ? "待计算" : "未闭合";

  const markCopied = async (text: string, ok = "已复制，与预览一致") => {
    const done = await copyText(text);
    setCopyTip(done ? ok : "复制失败，请手动选择预览文本");
  };

  const doExport = (kind: "md" | "doc") => {
    const generatedAt = new Date().toLocaleString("zh-CN");
    const opts = { generatedAt, draftOverride: !qc.canExport };
    const base = fileBase(input);
    if (kind === "md") {
      downloadText(
        `${base}.md`,
        buildMarkdown(input, result, qc, opts),
        "text/markdown;charset=utf-8"
      );
    } else {
      downloadText(
        `${base}.doc`,
        buildWordDocument(input, result, qc, opts),
        "application/msword;charset=utf-8"
      );
    }
    setPendingExport(null);
  };

  const requestExport = (kind: "md" | "doc") => {
    if (qc.canExport) doExport(kind);
    else setPendingExport(kind);
  };

  const exportProjectJson = () => {
    downloadText(`${fileBase(input)}.json`, stringifyProject(input), "application/json;charset=utf-8");
    setIoTip("已导出项目 JSON，可作为邮件附件。");
  };

  const importProjectJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      replace(parseProject(text));
      setIoTip(`已载入 ${file.name}`);
    } catch (err) {
      setIoTip(err instanceof Error ? err.message : "JSON 无法识别");
    }
  };

  return (
    <div className="wbr-app">
      <div className="wbr-hero">
        <div>
          <p className="wbr-kicker">报告生成 / 室内岗</p>
          <h1 className="text-balance">水资源论证 / 水平衡报告生成器</h1>
          <p className="wbr-sell text-pretty">{WORK_BLURB}</p>
          <p className="wbr-tags">
            {WORK_TAGS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        </div>
        <div className="wbr-hero-actions">
          <span className="wbr-pill">演示草稿 · 非正式论证</span>
          <button type="button" className="wbr-btn ghost" onClick={() => replace(emptyInput())}>
            清空
          </button>
        </div>
      </div>

      <div className="wbr-cases">
        <div className="wbr-cases-head">案例库</div>
        <div className="wbr-case-row">
          {CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="wbr-case"
              onClick={() => {
                replace(c.input);
                setIoTip(`已载入案例「${c.title}」`);
              }}
            >
              <strong>{c.title}</strong>
              <span>{c.blurb}</span>
            </button>
          ))}
        </div>
        <div className="wbr-io">
          <button type="button" className="wbr-btn" onClick={exportProjectJson}>
            导出项目 JSON
          </button>
          <button type="button" className="wbr-btn" onClick={() => fileRef.current?.click()}>
            导入项目 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              importProjectJson(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {ioTip ? <span className="wbr-io-tip">{ioTip}</span> : null}
        </div>
      </div>

      <aside className="wbr-formulas" aria-label="水量关系主口径">
        <article>
          <code>D = Σ Qi</code>
          <p>需水合计 = 表内分项之和，不另开表外合计</p>
        </article>
        <article>
          <code>C = Q − R</code>
          <p>耗水唯一口径：取水 − 退水，不用工艺耗水</p>
        </article>
        <article>
          <code>Δ = Q − (D + L)</code>
          <p>供给闭合；退水不进 Δ。|Δ|&lt;0.005 才可称闭合</p>
        </article>
      </aside>

      <div className="wbr-grid">
        <section className="wbr-panel" aria-labelledby="wbr-form">
          <h2 id="wbr-form">输入</h2>
          <div className="wbr-unitbar">
            <span>水量单位</span>
            <div className="wbr-unit-toggle" role="group" aria-label="水量单位">
              <button
                type="button"
                className={input.unit === "万m³/a" ? "is-on" : ""}
                onClick={() => switchUnit("万m³/a")}
              >
                万m³/a
              </button>
              <button
                type="button"
                className={input.unit === "m³/d" ? "is-on" : ""}
                onClick={() => switchUnit("m³/d")}
              >
                m³/d
              </button>
            </div>
          </div>
          {unitTip ? (
            <p className="wbr-unit-tip" role="status">
              {unitTip}
            </p>
          ) : null}

          <div className="wbr-fields">
            <label>
              项目名称
              <input
                value={input.projectName}
                onChange={(e) => patch({ projectName: e.target.value })}
              />
            </label>
            <label>
              建设地点
              <input value={input.location} onChange={(e) => patch({ location: e.target.value })} />
            </label>
            <label>
              业主
              <input value={input.owner} onChange={(e) => patch({ owner: e.target.value })} />
            </label>
            <label>
              行业 / 用途
              <input
                value={input.industry}
                onChange={(e) => patch({ industry: e.target.value })}
                placeholder="工业集中区 / 灌溉 / 城镇供水"
              />
            </label>
            <label>
              编制年
              <input
                type="number"
                className="tabular"
                value={input.year}
                onChange={(e) => patch({ year: Number(e.target.value) })}
              />
            </label>
            <label>
              水平年
              <input
                type="number"
                className="tabular"
                value={input.horizonYear}
                onChange={(e) => patch({ horizonYear: Number(e.target.value) })}
              />
            </label>
            <label>
              水源名称
              <input
                value={input.sourceName}
                onChange={(e) => patch({ sourceName: e.target.value })}
              />
            </label>
            <label>
              水源类型
              <select
                value={input.sourceType}
                onChange={(e) =>
                  patch({ sourceType: e.target.value as WaterBalanceInput["sourceType"] })
                }
              >
                <option>地表水</option>
                <option>地下水</option>
                <option>再生水</option>
                <option>混合水源</option>
              </select>
            </label>
            <label>
              保证率
              <select
                value={input.reliability ?? ""}
                onChange={(e) =>
                  patch({
                    reliability: e.target.value
                      ? (Number(e.target.value) as 75 | 90 | 95)
                      : null,
                  })
                }
              >
                <option value="">请选择</option>
                <option value={75}>75%（灌溉常见）</option>
                <option value={90}>90%</option>
                <option value={95}>95%（生活/工业常见）</option>
              </select>
            </label>
            <label>
              取水量 Q
              <span className="wbr-field-unit">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="tabular"
                  value={input.withdrawal}
                  onChange={(e) => patch({ withdrawal: Number(e.target.value) })}
                />
                <em>{unit}</em>
              </span>
            </label>
            <label>
              退水量 R
              <span className="wbr-field-unit">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="tabular"
                  value={input.returnWater}
                  onChange={(e) => patch({ returnWater: Number(e.target.value) })}
                />
                <em>{unit}</em>
              </span>
            </label>
            <label>
              管网/未计量损失 L
              <span className="wbr-field-unit">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="tabular"
                  value={input.loss}
                  onChange={(e) => patch({ loss: Number(e.target.value) })}
                />
                <em>{unit}</em>
              </span>
            </label>
          </div>

          <div className="wbr-table-head">
            <h3>需水结构</h3>
            <button type="button" className="wbr-btn" onClick={addDemand}>
              增加用水户
            </button>
          </div>
          <div className="wbr-table-wrap">
            <table className="wbr-table">
              <thead>
                <tr>
                  <th>用水户</th>
                  <th>需水（{unit}）</th>
                  <th>备注</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {input.demands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="wbr-empty">
                      暂无分项。点击「增加用水户」后填写，需水合计才会有数。
                    </td>
                  </tr>
                ) : (
                  input.demands.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <input
                          value={d.name}
                          aria-label={`${d.name || "用水户"}名称`}
                          onChange={(e) => setDemand(d.id, "name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          className="tabular"
                          aria-label={`${d.name || "用水户"}需水量`}
                          value={d.volume}
                          onChange={(e) => setDemand(d.id, "volume", Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          value={d.note}
                          aria-label={`${d.name || "用水户"}备注`}
                          onChange={(e) => setDemand(d.id, "note", e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="wbr-btn ghost wbr-mini"
                          onClick={() => removeDemand(d.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className={tableOk ? "wbr-check is-ok" : "wbr-check is-bad"} role="status">
            表内校验：分项之和 {fmtVol(rowSum)} − 需水合计 {fmtVol(demandTotal)} ={" "}
            {fmtSigned(tableGap)} {unit}
            {tableOk ? "（一致）" : `（超差 ${fmtSigned(tableGap)} ${unit}）`}
          </p>
        </section>

        <section className="wbr-panel" aria-labelledby="wbr-out" key={revision}>
          <div className="wbr-panel-head">
            <h2 id="wbr-out">章节预览</h2>
            <div className="wbr-hero-actions">
              <button
                type="button"
                className="wbr-btn"
                onClick={() => markCopied(balanceMd, "已复制第 4 节水平衡表")}
              >
                复制水平衡表
              </button>
              <button type="button" className="wbr-btn" onClick={() => markCopied(md)}>
                复制全文
              </button>
              <button
                type="button"
                className="wbr-btn primary"
                onClick={() => requestExport("md")}
              >
                下载 Markdown
              </button>
              <button
                type="button"
                className="wbr-btn primary"
                onClick={() => requestExport("doc")}
              >
                下载 Word
              </button>
            </div>
          </div>

          {!qc.canExport ? (
            <p className="wbr-block" role="alert">
              存在 {qc.hardCount} 条硬校验。仍可导出，但须确认「仍要导出草稿」；封面与页眉将标注非正式 / 质控未通过。
            </p>
          ) : null}
          {copyTip ? (
            <p className="wbr-unit-tip" role="status">
              {copyTip}
            </p>
          ) : null}

          <div className="wbr-kpis">
            <div>
              <b className="tabular">{fmtVol(result.demandTotal)}</b>
              <span>需水合计 D · {unit}</span>
            </div>
            <div>
              <b className="tabular">{fmtVol(result.consume)}</b>
              <span>耗水 C=Q−R · {unit}</span>
            </div>
            <div>
              <b className="tabular">{fmtVol(result.returnRate)}%</b>
              <span>退水率 R/Q</span>
            </div>
            <div className={kpiResidualClass}>
              <b className="tabular">{residualLabel}</b>
              <span>
                Δ {fmtSigned(result.residual)} {unit}
              </span>
            </div>
          </div>

          <div className="wbr-doc" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </section>

        <aside className="wbr-panel wbr-qc" aria-labelledby="wbr-qc">
          <h2 id="wbr-qc">质控结果</h2>
          <p className="wbr-qc-sum">
            硬校验 {qc.hardCount} · 软校验 {qc.softCount}
            {qc.canExport ? " · 可导出" : " · 须确认后导出草稿"}
          </p>
          <p className="wbr-qc-note">
            模拟咨询院交付前校核。硬校验须确认后才能导出草稿；软校验为经验黄灯，可直接导出。区间见{" "}
            <code>rules.json</code>，非正式规范。
          </p>
          {qc.findings.length === 0 ? (
            <p className="wbr-check is-ok">
              未触发软硬规则。只说明未触发表内经验阈值，不等于论证充分。
            </p>
          ) : (
            <ul className="wbr-qc-list">
              {qc.findings.map((f) => (
                <li key={f.id} className={f.level === "hard" ? "is-hard" : "is-soft"}>
                  <div className="wbr-qc-top">
                    <span>{f.level === "hard" ? "硬校验" : "软校验"}</span>
                    <strong>{f.name}</strong>
                  </div>
                  <p>{f.detail}</p>
                  <p className="wbr-qc-advice">建议修改：{f.advice}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {pendingExport ? (
        <div className="wbr-modal" role="dialog" aria-modal="true" aria-labelledby="wbr-confirm">
          <div className="wbr-modal-card">
            <h3 id="wbr-confirm">硬校验未通过</h3>
            <p>
              当前有 {qc.hardCount} 条硬校验。导出文件将带「演示非正式 / 质控未通过」标记，仅作室内草稿。
            </p>
            <div className="wbr-hero-actions">
              <button type="button" className="wbr-btn ghost" onClick={() => setPendingExport(null)}>
                取消
              </button>
              <button
                type="button"
                className="wbr-btn primary"
                onClick={() => doExport(pendingExport)}
              >
                仍要导出草稿
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
