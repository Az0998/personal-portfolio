"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SAMPLE_SERIES,
  designTable,
  empiricalPoints,
  moments,
  parseSeries,
} from "@/lib/freq/pearson3";

export function FreqApp() {
  const [text, setText] = useState(SAMPLE_SERIES);
  const parsed = useMemo(() => parseSeries(text), [text]);
  const stats = useMemo(() => moments(parsed), [parsed]);
  const rows = useMemo(() => (stats ? designTable(stats) : []), [stats]);
  const points = useMemo(() => (stats ? empiricalPoints(stats.series) : []), [stats]);

  return (
    <div className="freq-app">
      <header className="freq-hero">
        <p className="freq-kicker">设计值 · 教学矩法</p>
        <h1>水文频率小算盘</h1>
        <p>
          年最大系列 → 均值、Cv、Cs → P-III 频率因子（Wilson–Hilferty）→ 设计值。
          给设计院面试讲「适线之前的矩法」，不是审查用成果。
        </p>
        <p className="freq-links">
          <Link href="/xaj-bench">产汇流对照</Link>
          <Link href="/hydrobench">智慧水利</Link>
        </p>
      </header>

      <p className="freq-warn">
        短系列的 Cs 很不稳。这里不做目估适线、不考虑历史特大值。样本请用正数，至少 5 个。
      </p>

      <section className="freq-grid">
        <label className="freq-panel">
          <span>年最大系列（空格或换行分隔）</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={16} />
          <small>
            已识别 {parsed.length} 个数
            {parsed.length < 5 ? " · 至少 5 个正数" : ""}
          </small>
        </label>

        <div className="freq-panel">
          <h2>矩法参数</h2>
          {stats ? (
            <table>
              <tbody>
                <tr>
                  <td>n</td>
                  <td>{stats.n}</td>
                </tr>
                <tr>
                  <td>均值 x̄</td>
                  <td>{stats.mean.toFixed(1)}</td>
                </tr>
                <tr>
                  <td>Cv</td>
                  <td>{stats.cv.toFixed(3)}</td>
                </tr>
                <tr>
                  <td>Cs</td>
                  <td>{stats.cs.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>样本不够，暂不算。</p>
          )}
          <h2>设计值 xp = x̄ (1 + Cv Φp)</h2>
          <table>
            <thead>
              <tr>
                <th>频率 P</th>
                <th>Φ</th>
                <th>设计值</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p}>
                  <td>{(r.p * 100).toFixed(0)}%</td>
                  <td>{r.phi.toFixed(3)}</td>
                  <td>{r.value.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {points.length > 0 && (
        <section className="freq-panel">
          <h2>经验点（Weibull，大→小）</h2>
          <ul className="freq-points">
            {points.slice(0, 8).map((pt) => (
              <li key={`${pt.p}-${pt.value}`}>
                P≈{(pt.p * 100).toFixed(1)}% · {pt.value.toFixed(0)}
              </li>
            ))}
          </ul>
          <p className="freq-note">只列出最大的 8 个点，用来看曲线是否盖住大值，不是适线。</p>
        </section>
      )}
    </div>
  );
}
