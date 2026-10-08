"use client";

import { SIX_LABELS } from "@/lib/cs-life/catalog";
import type { JudgeStats, SixKey, SixStats } from "@/lib/cs-life/types";

const KEYS = Object.keys(SIX_LABELS) as SixKey[];

type Props = { stats: SixStats; judges?: JudgeStats; size?: number };

export function RadarChart({ stats, judges, size = 220 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = KEYS.length;

  const pt = (i: number, v: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };

  const poly = KEYS.map((k, i) => pt(i, stats[k]).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="csl-radar"
        aria-label="六维能力图"
      >
        {rings.map((t) => (
          <polygon
            key={t}
            points={KEYS.map((_, i) => pt(i, t * 100).join(",")).join(" ")}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        ))}
        {KEYS.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" />;
        })}
        <polygon points={poly} fill="rgba(17,138,178,0.28)" stroke="#118ab2" strokeWidth="2" />
        {KEYS.map((k, i) => {
          const [x, y] = pt(i, 112);
          return (
            <text
              key={k}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#333"
            >
              {SIX_LABELS[k]} {Math.round(stats[k])}
            </text>
          );
        })}
      </svg>
      {judges && (
        <ul className="csl-judges" aria-label="判定维">
          <li>
            <span>颜值</span>
            <strong>{Math.round(judges.appearance)}</strong>
          </li>
          <li>
            <span>忠诚</span>
            <strong>{Math.round(judges.loyalty)}</strong>
          </li>
          <li>
            <span>名气</span>
            <strong>{Math.round(judges.fame)}</strong>
          </li>
          <li>
            <span>状态</span>
            <strong>{Math.round(judges.form)}</strong>
          </li>
          <li>
            <span>残局</span>
            <strong>{Math.round(judges.clutch)}</strong>
          </li>
        </ul>
      )}
    </div>
  );
}
