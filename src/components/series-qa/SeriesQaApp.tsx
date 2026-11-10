"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SAMPLE_CSV, inspectCsv, issuesToCsv } from "@/lib/series-qa/inspect";

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function SeriesQaApp() {
  const [text, setText] = useState(SAMPLE_CSV);
  const [fileName, setFileName] = useState("示例");
  const report = useMemo(() => inspectCsv(text), [text]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  }

  return (
    <div className="sqa">
      <header className="sqa-hero">
        <p className="sqa-kicker">本机应用 · 不上传</p>
        <h1>系列质检台</h1>
        <p>
          把带时间列的 CSV 拖进来。程序标出空值、非数字、重复时刻、时间倒序、缺测间隔、负值和尖峰，并可导出问题清单。
          文件只在这台浏览器里解析。
        </p>
        <p className="sqa-links">
          <Link href="/labs">互动演示</Link>
          <Link href="/xaj-bench">产汇流对照</Link>
        </p>
      </header>

      <div
        className="sqa-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <span>拖入 CSV，或点选文件。当前：{fileName}</span>
        <button type="button" onClick={() => { setText(SAMPLE_CSV); setFileName("示例"); }}>
          载入示例
        </button>
      </div>

      <label className="sqa-paste">
        <span>也可以直接粘贴</span>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setFileName("粘贴"); }} rows={8} />
      </label>

      {report ? (
        <>
          <section className="sqa-stats">
            <div>
              <b>{report.points.length}</b>
              <span>数据行</span>
            </div>
            <div>
              <b>{report.issues.length}</b>
              <span>问题条数</span>
            </div>
            <div>
              <b>{report.timeName}</b>
              <span>时间列</span>
            </div>
            <div>
              <b>{report.valueName}</b>
              <span>数值列</span>
            </div>
          </section>
          <ul className="sqa-counts">
            {Object.entries(report.counts).map(([k, n]) => (
              <li key={k} data-on={n > 0}>
                {k} {n}
              </li>
            ))}
          </ul>
          <div className="sqa-actions">
            <button type="button" onClick={() => download("series-qa-issues.csv", issuesToCsv(report))} disabled={!report.issues.length}>
              导出问题清单
            </button>
          </div>
          <table className="sqa-table">
            <thead>
              <tr>
                <th>行</th>
                <th>时刻</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {report.issues.slice(0, 80).map((issue, i) => (
                <tr key={`${issue.row}-${issue.kind}-${i}`}>
                  <td>{issue.row}</td>
                  <td>{issue.time || "—"}</td>
                  <td>{issue.kind}</td>
                  <td>{issue.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.issues.length > 80 && <p className="sqa-note">表上只显示前 80 条，导出文件含全部。</p>}
          {!report.issues.length && <p className="sqa-note">这批数据没有触发上述规则。</p>}
        </>
      ) : (
        <p className="sqa-note">需要表头加至少一行数据。</p>
      )}

      <p className="sqa-note">
        尖峰规则：相对两侧邻点的跳变都超过步间变幅中位数的 4 倍，并且是局部极值。缺测：间隔超过常见步长的 1.8 倍。
        这是入库前的筛子，不是正式整编。
      </p>
    </div>
  );
}
