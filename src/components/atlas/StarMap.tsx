"use client";

import { useEffect, useRef } from "react";
import { HALLS, type AtlasExhibit, type AtlasHall } from "@/data/atlas";

const CLUSTER: Record<AtlasHall, { x: number; y: number }> = {
  hydro: { x: 0.24, y: 0.4 },
  demo: { x: 0.72, y: 0.3 },
  paper: { x: 0.5, y: 0.18 },
  tool: { x: 0.78, y: 0.7 },
  design: { x: 0.28, y: 0.74 },
};

function layout(items: AtlasExhibit[], w: number, h: number) {
  const groups = new Map<AtlasHall, AtlasExhibit[]>();
  for (const e of items) {
    const g = groups.get(e.hall) ?? [];
    g.push(e);
    groups.set(e.hall, g);
  }
  const pos = new Map<string, { x: number; y: number }>();
  groups.forEach((list, hall) => {
    const c = CLUSTER[hall];
    list.forEach((e, i) => {
      const a = (i / Math.max(list.length, 1)) * Math.PI * 2 + hall.length;
      const r = 42 + (i % 5) * 10;
      pos.set(e.slug, {
        x: c.x * w + Math.cos(a) * r,
        y: c.y * h + Math.sin(a) * r * 0.72,
      });
    });
  });
  return pos;
}

type Props = {
  items: AtlasExhibit[];
  selected: string;
  onSelect: (slug: string) => void;
};

export function StarMap({ items, selected, onSelect }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(new Map<string, { x: number; y: number }>());
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      posRef.current = layout(items, canvas.clientWidth, canvas.clientHeight);
    };
    fit();

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97) % w) + Math.sin(t * 0.01 + i) * 4;
        const y = ((i * 53) % h) + 8;
        ctx.globalAlpha = 0.12 + (i % 4) * 0.05;
        ctx.fillRect(x, y, 1.2, 1.2);
      }

      const pos = posRef.current;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "rgba(255,154,171,0.7)";
      ctx.font = "11px Noto Sans SC, sans-serif";
      (Object.keys(CLUSTER) as AtlasHall[]).forEach((hall) => {
        if (!items.some((e) => e.hall === hall)) return;
        const c = CLUSTER[hall];
        const label = HALLS.find((h) => h.id === hall)?.label ?? hall;
        ctx.fillText(label, c.x * w - 18, Math.max(16, c.y * h - 52));
      });

      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1;
      items.forEach((a, i) => {
        const p = pos.get(a.slug);
        if (!p) return;
        items.slice(i + 1).forEach((b) => {
          if (a.hall !== b.hall && a.story !== b.story) return;
          const q = pos.get(b.slug);
          if (!q) return;
          ctx.strokeStyle = a.color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        });
      });

      items.forEach((e) => {
        const p = pos.get(e.slug);
        if (!p) return;
        const hot = e.slug === selected || e.slug === hoverRef.current;
        const r = hot ? 9 : 5.5;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (hot) {
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 7 + Math.sin(t * 0.08) * 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = e.color;
          ctx.stroke();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = "#fff";
          ctx.font = "12px Noto Sans SC, sans-serif";
          ctx.fillText(e.emoji + " " + e.title.slice(0, 10), p.x + 12, p.y + 4);
        }
      });

      t += reduced ? 0 : 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const hit = (x: number, y: number) => {
      let bestSlug: string | null = null;
      let bestD = 22 * 22;
      posRef.current.forEach((p, slug) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          bestSlug = slug;
        }
      });
      return bestSlug;
    };

    const onMove = (ev: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      hoverRef.current = hit(ev.clientX - box.left, ev.clientY - box.top);
    };
    const onClick = (ev: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const slug = hit(ev.clientX - box.left, ev.clientY - box.top);
      if (slug) onSelect(slug);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onClick);
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onClick);
      ro.disconnect();
    };
  }, [items, selected, onSelect]);

  return <canvas ref={ref} className="atlas-map" role="img" aria-label="作品星图" />;
}
