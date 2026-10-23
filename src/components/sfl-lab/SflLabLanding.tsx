"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Preview = {
  t: number[];
  lywAnomMm: number[];
  echo1: number[];
  rainMm30: number[];
};

const STEPS = [
  ["接入", "称重必传；探头、气象可缺。时段对不上不混用。"],
  ["曲线", "距平与三层 θ。色带是可疑段。"],
  ["旗标", "无雨台阶、日周期、深层先动标可疑。"],
  ["订正", "只订 5TE 的 θ。滤波看残差。"],
  ["水平衡", "P、ET、ΔS、D。无同期气象则 P 只来自称重。"],
  ["验证", "浅层先湿；θ 跟土温假抖就订正。"],
  ["报告", "一段可粘贴文字。ET0 ≠ ETa。"],
];

function pathFrom(values: number[], w = 640, h = 160, pad = 8) {
  if (!values.length) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = pad + (1 - (v - lo) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function Spark({
  title,
  values,
  unit,
  color,
  bars,
}: {
  title: string;
  values: number[];
  unit: string;
  color: string;
  bars?: boolean;
}) {
  const w = 640;
  const h = 160;
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 1;
  const d = pathFrom(values, w, h);
  return (
    <div className="sflab-card">
      <div className="sflab-chart-label">
        <span>{title}</span>
        <span className="tabular-nums">
          {lo.toFixed(2)} – {hi.toFixed(2)} {unit}
        </span>
      </div>
      <svg className="sflab-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
        {bars
          ? values.map((v, i) => {
              const x = 8 + (i / Math.max(values.length - 1, 1)) * (w - 16);
              const span = hi - lo || 1;
              const bh = ((v - lo) / span) * (h - 16);
              return (
                <rect
                  key={i}
                  x={x - 0.7}
                  y={h - 8 - bh}
                  width={1.4}
                  height={Math.max(bh, 0)}
                  fill={color}
                  opacity={v > 0 ? 0.9 : 0.15}
                />
              );
            })
          : (
            <path d={d} fill="none" stroke={color} strokeWidth="2.2" />
          )}
      </svg>
    </div>
  );
}

export function SflLabLanding({ liveOrigin }: { liveOrigin: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    fetch("/sfl-lab/sample/sim_preview.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setPreview)
      .catch(() => setPreview(null));
  }, []);

  const rainMax = useMemo(() => (preview ? Math.max(...preview.rainMm30) : 0), [preview]);

  return (
    <div className="sflab-page">
      <p className="sflab-kicker">智慧水利 · 采集分支</p>
      <h1>微型蒸渗仪实验站</h1>
      <p className="sflab-lead">
        榆中萃英山。七步质控。曲线机制按数据写：秋末浅层白天 θ 抬先当介电。
        三类可缺、可错位；错位则雨量 / ET0 作废。泵不是雨。ET0 ≠ ETa。
      </p>
      <div className="sflab-actions">
        {liveOrigin ? (
          <a className="sflab-btn sflab-btn-primary" href={liveOrigin} target="_blank" rel="noreferrer">
            打开七步课堂
          </a>
        ) : (
          <a className="sflab-btn sflab-btn-primary" href="#steps">
            看七步流程
          </a>
        )}
        {liveOrigin ? (
          <a className="sflab-btn sflab-btn-quiet" href={`${liveOrigin.replace(/\/$/, "")}/plot`} target="_blank" rel="noreferrer">
            打开自由作图
          </a>
        ) : null}
        <Link className="sflab-btn sflab-btn-quiet" href="/hydrobench">
          回到智慧水利
        </Link>
      </div>

      <p className="sflab-note">
        旧版浏览器内核仍在 <Link href="/sfl">/sfl</Link>。本页是完整七步教学站。
      </p>

      <section id="steps" className="sflab-grid sflab-grid-2" style={{ marginBottom: "1.25rem" }}>
        <div className="sflab-card">
          <h2>七步课堂</h2>
          <ol className="sflab-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="sflab-n">{i + 1}</span>
                <span>
                  <strong>{t}</strong>
                  <br />
                  {d}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="sflab-card">
          <h2>读图与覆盖</h2>
          <p>0.0707 m²，5 g ≈ 0.071 mm。泵是内部调水。</p>
          <p>θ 与土温同位相 → 介电假湿。三层同跳 → 温度，不是锋面。</p>
          <p>探头或气象整体缺失、或与称重无交集：跳过对应对照，不补造。</p>
        </div>
      </section>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.7rem" }}>曲线长什么样</h2>
      <p className="sflab-muted" style={{ marginTop: 0, marginBottom: "0.8rem" }}>
        示例：距平 mm 级；15 cm 白天假抬是订正对象。
      </p>
      {preview ? (
        <div className="sflab-grid" style={{ marginBottom: "1.5rem" }}>
          <Spark title="蒸渗桶质量距平" values={preview.lywAnomMm} unit="mm" color="#7dd3fc" />
          <Spark title="15 cm 表观 θ" values={preview.echo1} unit="%" color="#fbbf24" />
          <Spark
            title={`气象雨强（30 min 合计，峰值 ${rainMax.toFixed(2)} mm）`}
            values={preview.rainMm30}
            unit="mm"
            color="#38bdf8"
            bars
          />
        </div>
      ) : (
        <p className="sflab-muted">预览序列载入中…</p>
      )}

      <section className="sflab-card" style={{ marginBottom: "1.25rem" }}>
        <h2>本机跑完整七步</h2>
        <p>Spring Boot 8080 + Vue 5173。先上传 CSV，没有实测再点接入页的课堂示例。</p>
        <pre className="sflab-code">{`cd sfl-lab/backend && ./mvnw spring-boot:run
cd sfl-lab/frontend && npm run dev
# 浏览器打开 http://127.0.0.1:5173`}</pre>
      </section>

      {liveOrigin ? (
        <section id="classroom">
          <h2 style={{ fontSize: "1.1rem" }}>七步课堂台</h2>
          <p className="sflab-muted">
            需要本机 Vue 5173 + Spring Boot 8080。空白就
            <a href={liveOrigin} target="_blank" rel="noreferrer"> 新窗口打开 {liveOrigin}</a>
            。
          </p>
          <div className="sflab-frame-wrap">
            <iframe
              className="sflab-frame"
              title="微型蒸渗仪实验站"
              src={liveOrigin}
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
