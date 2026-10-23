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
  ["接入", "上传称重、探头、气象 CSV（与 DT80 同表头）。没有实测时再载入课堂示例。"],
  ["曲线", "质量距平贴合 mm 级变幅；泵柱若空，读图下说明，不要把空图当尺度坏了。"],
  ["旗标", "宁可多标：无雨 θ 起伏、介电日周期、层序反常。"],
  ["订正", "温度订正只作用于 5TE 的 θ。滤波差别看残差，不要看四条重合的全序列。"],
  ["水平衡", "P、ET、ΔS、D。泵和风振不是雨。闭合差写在卡片上。"],
  ["验证", "浅层是否先湿、θ 是否跟着土温假抖、深层会不会抢先。"],
  ["报告", "一段可粘贴的文字。ET0 只是参考，不是 ETa。"],
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
        课堂七步：接入 → 曲线 → 旗标 → 订正 → 水平衡 → 验证 → 报告。
        页面独立，不挤进水文工作台页签。泵不是雨，风振不是蒸散，ET0 不是 ETa。
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
          <h2>硬约束</h2>
          <p>底面积 0.0707 m²，1 kg = 14.14 mm。手册 5 g 对应约 0.071 mm，不是 0.035 mm。</p>
          <p>泵是土柱与补水桶之间的内部调水，不是降水或蒸散。</p>
          <p>Kapilaratne 订正只作用于 5TE 体积含水量；ET0 是参考蒸散，不是蒸渗仪 ETa。</p>
        </div>
      </section>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.7rem" }}>曲线长什么样</h2>
      <p className="sflab-muted" style={{ marginTop: 0, marginBottom: "0.8rem" }}>
        课堂示例 14 天：质量距平有 mm 级起伏；15 cm θ 白天会假抬，那是订正对象；雨日与泵不要混。
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
