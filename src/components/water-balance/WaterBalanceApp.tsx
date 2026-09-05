"use client";

import { useEffect, useMemo, useState } from "react";
import { computeBalance, emptyInput, SAMPLE_INPUT } from "@/lib/water-balance/compute";
import {
  buildMarkdown,
  buildRationality,
  buildWordHtml,
  downloadText,
} from "@/lib/water-balance/report";
import type { WaterBalanceInput } from "@/lib/water-balance/types";

const KEY = "water-balance-report:v1";

function load(): WaterBalanceInput {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SAMPLE_INPUT;
    return { ...SAMPLE_INPUT, ...JSON.parse(raw) };
  } catch {
    return SAMPLE_INPUT;
  }
}

export function WaterBalanceApp() {
  const [input, setInput] = useState<WaterBalanceInput>(SAMPLE_INPUT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInput(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(input));
  }, [input, ready]);

  const result = useMemo(() => computeBalance(input), [input]);
  const md = useMemo(() => buildMarkdown(input, result), [input, result]);
  const rationale = useMemo(() => buildRationality(input, result), [input, result]);

  const patch = (p: Partial<WaterBalanceInput>) => setInput((s) => ({ ...s, ...p }));

  const setDemand = (id: string, field: "name" | "volume" | "note", value: string | number) => {
    setInput((s) => ({
      ...s,
      demands: s.demands.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    }));
  };

  const slug = (input.projectName || "water-balance").replace(/[\\/:*?"<>|]/g, "").slice(0, 32);

  return (
    <div className="wbr-app">
      <div className="wbr-hero">
        <div>
          <p className="wbr-kicker">Indoor / 室内岗</p>
          <h1 className="text-balance">水资源论证 / 水平衡报告生成器</h1>
          <p className="wbr-sell text-pretty">
            填取水量、退水、保证率和需水结构，即时生成简化论证章节与水平衡表。信息化交付里的业务文档自动化，不是又一块看板。
          </p>
        </div>
        <div className="wbr-hero-actions">
          <span className="wbr-pill">演示稿 · 非正式论证</span>
          <button type="button" className="wbr-btn" onClick={() => setInput(SAMPLE_INPUT)}>
            载入示例
          </button>
          <button type="button" className="wbr-btn ghost" onClick={() => setInput(emptyInput())}>
            清空
          </button>
        </div>
      </div>

      <div className="wbr-grid">
        <section className="wbr-panel" aria-labelledby="wbr-form">
          <h2 id="wbr-form">输入</h2>
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
                value={input.reliability}
                onChange={(e) =>
                  patch({ reliability: Number(e.target.value) as 75 | 90 | 95 })
                }
              >
                <option value={75}>75%（灌溉常见）</option>
                <option value={90}>90%</option>
                <option value={95}>95%（生活/工业常见）</option>
              </select>
            </label>
            <label>
              取水量（万m³/a）
              <input
                type="number"
                min={0}
                step="0.1"
                className="tabular"
                value={input.withdrawal}
                onChange={(e) => patch({ withdrawal: Number(e.target.value) })}
              />
            </label>
            <label>
              退水量（万m³/a）
              <input
                type="number"
                min={0}
                step="0.1"
                className="tabular"
                value={input.returnWater}
                onChange={(e) => patch({ returnWater: Number(e.target.value) })}
              />
            </label>
            <label>
              损耗（万m³/a）
              <input
                type="number"
                min={0}
                step="0.1"
                className="tabular"
                value={input.loss}
                onChange={(e) => patch({ loss: Number(e.target.value) })}
              />
            </label>
          </div>

          <h3>需水结构</h3>
          <div className="wbr-table-wrap">
            <table className="wbr-table">
              <thead>
                <tr>
                  <th>用水户</th>
                  <th>需水（万m³/a）</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {input.demands.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        value={d.name}
                        aria-label={`${d.name}名称`}
                        onChange={(e) => setDemand(d.id, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        className="tabular"
                        aria-label={`${d.name}需水量`}
                        value={d.volume}
                        onChange={(e) => setDemand(d.id, "volume", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        value={d.note}
                        aria-label={`${d.name}备注`}
                        onChange={(e) => setDemand(d.id, "note", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="wbr-panel" aria-labelledby="wbr-out">
          <div className="wbr-panel-head">
            <h2 id="wbr-out">输出</h2>
            <div className="wbr-hero-actions">
              <button
                type="button"
                className="wbr-btn primary"
                onClick={() =>
                  downloadText(
                    `${slug}-水平衡报告.md`,
                    md,
                    "text/markdown;charset=utf-8"
                  )
                }
              >
                下载 Markdown
              </button>
              <button
                type="button"
                className="wbr-btn primary"
                onClick={() =>
                  downloadText(
                    `${slug}-水平衡报告.doc`,
                    buildWordHtml(input, result),
                    "application/msword;charset=utf-8"
                  )
                }
              >
                下载 Word
              </button>
            </div>
          </div>

          <div className="wbr-kpis">
            <div>
              <b className="tabular">{result.demandTotal}</b>
              <span>需水合计</span>
            </div>
            <div>
              <b className="tabular">{result.consume}</b>
              <span>耗水量</span>
            </div>
            <div>
              <b className="tabular">{result.returnRate}%</b>
              <span>退水率</span>
            </div>
            <div>
              <b className="tabular">{result.closed ? "闭合" : "未闭合"}</b>
              <span>差 {result.residual}</span>
            </div>
          </div>

          <h3>水平衡表</h3>
          <div className="wbr-table-wrap">
            <table className="wbr-table static">
              <thead>
                <tr>
                  <th>项目</th>
                  <th>数量（万m³/a）</th>
                  <th>占取水</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>取水量</td>
                  <td className="tabular">{input.withdrawal}</td>
                  <td>100%</td>
                </tr>
                <tr>
                  <td>需水合计</td>
                  <td className="tabular">{result.demandTotal}</td>
                  <td className="tabular">
                    {input.withdrawal
                      ? `${((result.demandTotal / input.withdrawal) * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
                <tr>
                  <td>损耗</td>
                  <td className="tabular">{input.loss}</td>
                  <td className="tabular">{result.lossRate}%</td>
                </tr>
                <tr>
                  <td>退水量</td>
                  <td className="tabular">{input.returnWater}</td>
                  <td className="tabular">{result.returnRate}%</td>
                </tr>
                <tr>
                  <td>耗水量（取水−退水）</td>
                  <td className="tabular">{result.consume}</td>
                  <td className="tabular">{result.consumeRate}%</td>
                </tr>
                <tr>
                  <td>闭合差</td>
                  <td className="tabular">{result.residual}</td>
                  <td>{result.closed ? "基本闭合" : "需复核"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>取用水合理性简述</h3>
          {rationale.map((p) => (
            <p key={p.slice(0, 24)} className="wbr-para text-pretty">
              {p}
            </p>
          ))}

          <details className="wbr-md">
            <summary>完整章节预览（Markdown）</summary>
            <pre>{md}</pre>
          </details>
        </section>
      </div>
    </div>
  );
}
