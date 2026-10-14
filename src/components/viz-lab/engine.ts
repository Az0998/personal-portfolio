export type VizCtx = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  dt: number;
  params: Record<string, number>;
  pointer: { x: number; y: number; down: boolean; justDown: boolean };
  reduced: boolean;
};

export type VizSceneApi = {
  init?: (c: VizCtx) => void;
  reset?: (c: VizCtx) => void;
  draw: (c: VizCtx) => void;
  onPointer?: (c: VizCtx) => void;
};

export function clear(c: VizCtx, fill = "rgba(8,6,10,0.28)") {
  c.ctx.fillStyle = fill;
  c.ctx.fillRect(0, 0, c.w, c.h);
}

export function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
