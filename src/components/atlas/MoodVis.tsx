"use client";

import { useEffect, useRef } from "react";
import type { AtlasExhibit } from "@/data/atlas";

export function MoodVis({ exhibit }: { exhibit: AtlasExhibit }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    const color = exhibit.color;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.4;

      if (exhibit.mood === "hydro" || exhibit.mood === "field") {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = h * 0.55 + Math.sin(x * 0.045 + t * 0.05) * 12 + Math.sin(x * 0.02 - t * 0.03) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (exhibit.mood === "paper") {
        for (let i = 0; i < 7; i++) {
          const x = 18 + i * ((w - 36) / 6);
          const y = h * 0.72 - ((Math.sin(t * 0.04 + i) + 1) / 2) * h * 0.45;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x - 6, y, 12, h * 0.72 - y);
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (exhibit.mood === "novel") {
        for (let i = 0; i < 18; i++) {
          const x = (i * 47 + t * 0.4) % w;
          const y = (Math.sin(i * 1.7 + t * 0.02) * 0.5 + 0.5) * h;
          ctx.globalAlpha = 0.25 + (i % 5) * 0.1;
          ctx.beginPath();
          ctx.arc(x, y, 1.6 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (exhibit.mood === "pet") {
        const x = w * 0.5 + Math.sin(t * 0.05) * 28;
        const y = h * 0.55 + Math.abs(Math.sin(t * 0.08)) * -10;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - 4, y - 3, 1.4, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 3, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (exhibit.mood === "plant") {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.85);
        ctx.quadraticCurveTo(w * 0.5 + Math.sin(t * 0.03) * 8, h * 0.5, w * 0.5, h * 0.18);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w * 0.5 + 16, h * 0.42, 16, 7, -0.5, 0, Math.PI * 2);
        ctx.ellipse(w * 0.5 - 16, h * 0.5, 14, 6, 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const n = 5;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + t * 0.02;
          const r = 16 + (i % 2) * 8;
          const x = w * 0.5 + Math.cos(a) * r * 1.6;
          const y = h * 0.5 + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      t += reduced ? 0 : 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    draw();
    const onResize = () => {
      fit();
      if (reduced) draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [exhibit.slug, exhibit.mood, exhibit.color]);

  return <canvas ref={ref} className="atlas-vis" aria-hidden />;
}
