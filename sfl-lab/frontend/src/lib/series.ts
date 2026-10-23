export type SeriesSpec = {
  name: string
  type?: 'line' | 'bar' | 'scatter'
  yAxisIndex?: number
  data: [number, number][]
  dashed?: boolean
  barWidth?: number
  thick?: boolean
  color?: string
}

export function toNonZero(t: number[] = [], y: number[] = []): [number, number][] {
  const out: [number, number][] = []
  const n = Math.min(t.length, y.length)
  for (let i = 0; i < n; i++) {
    const v = Number(y[i])
    if (!Number.isFinite(v) || v === 0) continue
    out.push([t[i], v])
  }
  return out
}

export function toPairs(t: number[] = [], y: number[] = []): [number, number][] {
  const out: [number, number][] = []
  const n = Math.min(t.length, y.length)
  for (let i = 0; i < n; i++) {
    const v = Number(y[i])
    if (!Number.isFinite(v)) continue
    out.push([t[i], v])
  }
  return out
}

export function minus(t: number[] = [], a: number[] = [], b: number[] = []): [number, number][] {
  const out: [number, number][] = []
  const n = Math.min(t.length, a.length, b.length)
  for (let i = 0; i < n; i++) {
    const u = Number(a[i])
    const v = Number(b[i])
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue
    out.push([t[i], u - v])
  }
  return out
}

export function lagBars(acf: number[] = []): [number, number][] {
  return acf.map((v, i) => [i, Number.isFinite(Number(v)) ? Number(v) : 0])
}

export function hourlyMean(t: number[] = [], y: number[] = []): [number, number][] {
  const sum = new Array(24).fill(0)
  const n = new Array(24).fill(0)
  const m = Math.min(t.length, y.length)
  for (let i = 0; i < m; i++) {
    const v = Number(y[i])
    if (!Number.isFinite(v)) continue
    const h = new Date(t[i]).getUTCHours()
    sum[h] += v
    n[h]++
  }
  return sum.map((s, h) => [h, n[h] ? s / n[h] : NaN]).filter((p) => Number.isFinite(p[1])) as [number, number][]
}

export function hourlyHeat(t: number[] = [], y: number[] = []) {
  const days: string[] = []
  const idx = new Map<string, number>()
  const acc = new Map<string, { s: number; n: number }>()
  const m = Math.min(t.length, y.length)
  for (let i = 0; i < m; i++) {
    const v = Number(y[i])
    if (!Number.isFinite(v)) continue
    const d = new Date(t[i])
    const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    if (!idx.has(day)) {
      idx.set(day, days.length)
      days.push(day.slice(5))
    }
    const key = `${idx.get(day)}-${d.getUTCHours()}`
    const a = acc.get(key) || { s: 0, n: 0 }
    a.s += v
    a.n++
    acc.set(key, a)
  }
  const data: [number, number, number][] = []
  for (const [key, a] of acc) {
    const [di, h] = key.split('-').map(Number)
    data.push([h, di, a.s / a.n])
  }
  return { hours: Array.from({ length: 24 }, (_, i) => String(i)), days, data }
}

export function zipDaily(rows: any[] = [], xKey: string, yKey: string): [number, number][] {
  const out: [number, number][] = []
  for (const r of rows) {
    const x = Number(r[xKey])
    const y = Number(r[yKey])
    if (Number.isFinite(x) && Number.isFinite(y)) out.push([x, y])
  }
  return out
}
