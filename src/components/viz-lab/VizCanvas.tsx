"use client";

import { useEffect, useRef } from "react";
import type { VizSceneId } from "@/data/viz-lab";
import { SCENES } from "@/components/viz-lab/scenes";
import type { VizCtx } from "@/components/viz-lab/engine";

type Props = {
  sceneId: VizSceneId;
  params: Record<string, number>;
  paused: boolean;
  resetToken: number;
};

export function VizCanvas({ sceneId, params, paused, resetToken }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  const pausedRef = useRef(paused);
  const pointer = useRef({ x: 0, y: 0, down: false, justDown: false });
  paramsRef.current = params;
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t0 = performance.now();
    let t = 0;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const scene = SCENES[sceneId];
    const makeCtx = (now: number, dt: number): VizCtx => ({
      ctx,
      w: canvas.clientWidth,
      h: canvas.clientHeight,
      t,
      dt,
      params: paramsRef.current,
      pointer: { ...pointer.current },
      reduced,
    });

    scene.reset?.(makeCtx(t0, 16));
    scene.init?.(makeCtx(t0, 16));

    const tick = (now: number) => {
      const dt = Math.min(48, now - t0);
      t0 = now;
      if (!pausedRef.current) t += dt;
      const c = makeCtx(now, pausedRef.current ? 0 : dt);
      if (c.pointer.justDown || c.pointer.down) scene.onPointer?.(c);
      if (!pausedRef.current || c.pointer.justDown || c.pointer.down) scene.draw(c);
      pointer.current.justDown = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - box.left;
      pointer.current.y = e.clientY - box.top;
    };
    const onDown = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - box.left;
      pointer.current.y = e.clientY - box.top;
      pointer.current.down = true;
      pointer.current.justDown = true;
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      pointer.current.down = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [sceneId, resetToken]);

  return (
    <canvas
      ref={ref}
      className="viz-canvas"
      role="img"
      aria-label="可视化场景画布"
    />
  );
}
