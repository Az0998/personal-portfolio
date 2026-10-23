import type { SeriesSpec } from './series'

function finitePts(data: [number, number][]) {
  return data.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
}

export function extrema(data: [number, number][]) {
  const pts = finitePts(data)
  if (!pts.length) return null
  let lo = pts[0], hi = pts[0]
  let jump = 0
  let jumpAt = pts[0]
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][1] < lo[1]) lo = pts[i]
    if (pts[i][1] > hi[1]) hi = pts[i]
    if (i > 0) {
      const d = pts[i][1] - pts[i - 1][1]
      if (Math.abs(d) > Math.abs(jump)) {
        jump = d
        jumpAt = pts[i]
      }
    }
  }
  return { lo, hi, jump, jumpAt, n: pts.length, range: hi[1] - lo[1] }
}

function clock(ms: number) {
  if (!Number.isFinite(ms) || ms < 1e11) return String(ms)
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export function readout(kind: string, series: SeriesSpec[], extra?: string) {
  const main = series.find((s) => (s.data?.length || 0) > 4)
  if (!main) return extra || kind || '本图无有效点。'
  const e = extrema(main.data)
  if (!e) return extra || kind || '本图无有效点。'
  const nums = e.range < 1e-6
    ? `变幅 ${e.range.toFixed(4)}`
    : `变幅 ${e.range.toFixed(2)}，峰 ${clock(e.hi[0])}`
  return `${kind} ${nums}${extra ? ' ' + extra : ''}`.replace(/\s+/g, ' ').trim()
}

export function hasSeries(series: SeriesSpec[]) {
  return series.some((s) => finitePts(s.data || []).length > 2)
}

export function markPoints(data: [number, number][]) {
  const e = extrema(data)
  if (!e || e.range === 0) return []
  return [
    { t: e.hi[0], y: e.hi[1], label: `最大 ${e.hi[1].toFixed(2)}` },
    { t: e.lo[0], y: e.lo[1], label: `最小 ${e.lo[1].toFixed(2)}` },
  ]
}

export function flagScatter(points: { t: number; y: number; flag: number; reason: string }[], flag: number): [number, number][] {
  return points.filter((p) => p.flag === flag && Number.isFinite(p.y)).map((p) => [p.t, p.y])
}
