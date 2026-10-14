"use client";

import { useEffect, useRef } from "react";
import type { AtlasExhibit } from "@/data/atlas";

type Props = {
  items: AtlasExhibit[];
  selected: string;
  onSelect: (slug: string) => void;
};

export function OrbitStage({ items, selected, onSelect }: Props) {
  const rigRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      if (!dragging.current && !reducedRef.current) angleRef.current += 0.12;
      const el = rigRef.current;
      if (el) {
        el.style.transform = `rotateX(-14deg) rotateY(${angleRef.current}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const inner = items.filter((e) => e.featured);
  const outer = items.filter((e) => !e.featured);
  const rings = [
    { list: inner.length ? inner : items.slice(0, Math.ceil(items.length / 2)), z: 250 },
    { list: inner.length ? outer : items.slice(Math.ceil(items.length / 2)), z: 390 },
  ];

  return (
    <div
      className="atlas-orbit"
      onPointerDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        angleRef.current += (e.clientX - lastX.current) * 0.35;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <div className="atlas-core" aria-hidden />
      <div ref={rigRef} className="atlas-rig">
        {rings.flatMap((ring) =>
          ring.list.map((item, i) => {
            const theta = (360 / Math.max(ring.list.length, 1)) * i;
            return (
              <button
                key={item.slug}
                type="button"
                className={item.slug === selected ? "atlas-orb is-on" : "atlas-orb"}
                aria-pressed={item.slug === selected}
                aria-label={item.title}
                style={{
                  transform: `rotateY(${theta}deg) translateZ(${ring.z}px) scale(${item.slug === selected ? 1.12 : 1})`,
                  boxShadow: `0 0 18px ${item.color}55`,
                  borderColor: item.slug === selected ? item.color : undefined,
                }}
                onClick={() => onSelect(item.slug)}
              >
                <span aria-hidden>{item.emoji}</span>
                <small>{item.title}</small>
              </button>
            );
          })
        )}
      </div>
      <p className="atlas-hint">拖拽旋转 · 点击展品</p>
    </div>
  );
}
