"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WheelOption } from "@/lib/cs-life/types";
import { optionArcs, pickWeighted } from "@/lib/cs-life/wheel";

type Props = {
  options: WheelOption[];
  spinning: boolean;
  onSpinEnd: (opt: WheelOption) => void;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, sweep: number) {
  if (sweep >= 359.9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const end = start + sweep;
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

export function SpinWheel({ options, spinning, onSpinEnd }: Props) {
  const arcs = useMemo(() => optionArcs(options), [options]);
  const [rotation, setRotation] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    if (!spinning || lock.current) return;
    lock.current = true;
    const opt = pickWeighted(options);
    const arcsNow = optionArcs(options);
    const hit = arcsNow.find((a) => a.id === opt.id) ?? arcsNow[0];
    const landing = -90 - hit.midDeg;
    setRotation((prev) => {
      const cur = ((prev % 360) + 360) % 360;
      let delta = ((landing - cur) % 360 + 360) % 360;
      if (delta < 30) delta += 360;
      return prev + 5 * 360 + delta;
    });
    const t = window.setTimeout(() => {
      lock.current = false;
      onSpinEnd(opt);
    }, 3400);
    return () => window.clearTimeout(t);
  }, [spinning, options, onSpinEnd]);

  const cx = 160;
  const cy = 160;
  const r = 148;

  return (
    <div className={`csl-wheel-wrap${spinning ? " is-spinning" : ""}`}>
      <svg viewBox="0 0 320 320" className="csl-wheel" role="img" aria-label="命运转盘">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "160px 160px",
            transition: spinning ? "transform 3.2s cubic-bezier(0.12, 0.75, 0.12, 1)" : "none",
          }}
        >
          {arcs.map((a) => {
            const mid = polar(cx, cy, r * 0.62, a.midDeg);
            const label = a.label.length > 10 ? `${a.label.slice(0, 9)}…` : a.label;
            return (
              <g key={a.id}>
                <path
                  d={arcPath(cx, cy, r, a.startDeg, a.sweepDeg)}
                  fill={a.color}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <text
                  x={mid.x}
                  y={mid.y}
                  fill="#fff"
                  fontSize={a.sweepDeg < 28 ? 9 : 11}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${a.midDeg + 90}, ${mid.x}, ${mid.y})`}
                  style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,.35)" }}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={36} fill="#fff" />
        </g>
        <polygon points="160,42 152,58 168,58" fill="#fff" stroke="#222" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={34} fill="#fff" stroke="#eee" />
      </svg>
    </div>
  );
}
