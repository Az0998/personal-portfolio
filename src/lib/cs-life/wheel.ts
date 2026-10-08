import type { WheelOption } from "./types";

const PALETTE = [
  "#ef476f",
  "#f78c6b",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#073b4c",
  "#9b5de5",
  "#00bbf9",
  "#fee440",
  "#f15bb5",
];

export function withColors(options: Omit<WheelOption, "color">[]): WheelOption[] {
  return options.map((o, i) => ({
    ...o,
    color: PALETTE[i % PALETTE.length],
  }));
}

/** Normalize weights > 0; drop zero/negative. */
export function normalizeOptions(options: WheelOption[]): WheelOption[] {
  const cleaned = options
    .map((o) => ({ ...o, weight: Math.max(0, o.weight) }))
    .filter((o) => o.weight > 0);
  if (!cleaned.length) {
    return withColors([{ id: "none", label: "—", weight: 1 }]);
  }
  const sum = cleaned.reduce((s, o) => s + o.weight, 0);
  return cleaned.map((o) => ({ ...o, weight: o.weight / sum }));
}

export function pickWeighted(options: WheelOption[], rng = Math.random): WheelOption {
  const norm = normalizeOptions(options);
  let r = rng();
  for (const o of norm) {
    r -= o.weight;
    if (r <= 0) return o;
  }
  return norm[norm.length - 1];
}

/** Cumulative arcs in degrees for SVG pie (start at -90° = 12 o'clock). */
export function optionArcs(options: WheelOption[]) {
  const norm = normalizeOptions(options);
  let angle = -90;
  return norm.map((o) => {
    const sweep = o.weight * 360;
    const start = angle;
    angle += sweep;
    return { ...o, startDeg: start, sweepDeg: sweep, midDeg: start + sweep / 2 };
  });
}

/** Spin target: land mid of chosen segment + extra full turns. */
export function spinTargetDegrees(options: WheelOption[], pickedId: string, turns = 5) {
  const arcs = optionArcs(options);
  const hit = arcs.find((a) => a.id === pickedId) ?? arcs[0];
  // Pointer at 12 o'clock; rotate wheel so midDeg lands at -90.
  const landing = -90 - hit.midDeg;
  return turns * 360 + landing;
}

export function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
