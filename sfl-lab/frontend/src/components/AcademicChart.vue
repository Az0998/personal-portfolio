<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { COLORS } from '../state'
import type { SeriesSpec } from '../lib/series'
import { extrema } from '../lib/readout'

export type { SeriesSpec }

const props = withDefaults(defineProps<{
  title: string
  yName: string
  xName?: string
  series: SeriesSpec[]
  marks?: { t0: number; t1: number; code: string }[]
  y2Name?: string
  height?: string
  xType?: 'time' | 'value'
  yFromZero?: boolean
  compact?: boolean
  markLines?: { y: number; name: string }[]
  identityLine?: boolean
  annotate?: boolean
}>(), {
  xType: 'time',
  yFromZero: false,
  compact: false,
  identityLine: false,
  annotate: true,
})

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const yMin = ref('')
const yMax = ref('')
const from = ref('')
const to = ref('')

const markColor: Record<string, string> = {
  spike: 'rgba(185,28,28,0.22)',
  wind: 'rgba(14,116,144,0.20)',
  wall: 'rgba(180,83,9,0.18)',
  step: 'rgba(88,28,135,0.16)',
  bottle: 'rgba(15,118,110,0.16)',
  pump: 'rgba(55,65,81,0.16)',
  inferPump: 'rgba(109,40,217,0.18)',
  rainless: 'rgba(180,83,9,0.20)',
  missing: 'rgba(0,0,0,0.10)',
  orphan: 'rgba(185,28,28,0.20)',
  diurnal: 'rgba(217,119,6,0.22)',
  inversion: 'rgba(126,34,206,0.20)',
  wiggle: 'rgba(14,116,144,0.18)',
}

function utcDay(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}
function utcStamp(ms: number) {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
}

function fromInput(s: string) {
  if (!s) return undefined
  const t = Date.parse(s)
  return Number.isFinite(t) ? t : undefined
}

function axisBounds(axis: number, x0?: number, x1?: number) {
  let lo = Infinity
  let hi = -Infinity
  for (const s of props.series) {
    if ((s.yAxisIndex || 0) !== axis) continue
    for (const p of s.data || []) {
      const x = p[0]
      const y = p[1]
      if (!Number.isFinite(y)) continue
      if (x0 != null && x < x0) continue
      if (x1 != null && x > x1) continue
      lo = Math.min(lo, y)
      hi = Math.max(hi, y)
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1 }
  if (hi - lo < 1e-9) {
    const pad = Math.max(Math.abs(hi) * 0.025, 0.08)
    return { min: lo - pad, max: hi + pad }
  }
  const pad = (hi - lo) * 0.14
  return { min: lo - pad, max: hi + pad }
}

function option(): echarts.EChartsOption {
  const pieces = (props.marks || []).map((m) => ({
    xAxis: m.t0,
    x2: m.t1,
    itemStyle: { color: markColor[m.code] || 'rgba(0,0,0,0.08)' },
  }))
  const time = props.xType !== 'value'
  const x0 = fromInput(from.value)
  const x1 = fromInput(to.value)
  const y0 = axisBounds(0, x0, x1)
  const y1 = axisBounds(1, x0, x1)
  const ymin = yMin.value === '' ? (props.yFromZero ? 0 : y0.min) : Number(yMin.value)
  const ymax = yMax.value === '' ? (props.yFromZero ? Math.max(y0.max, y0.max * 1.12) : y0.max) : Number(yMax.value)
  const ml = (props.markLines || []).map((m) => ({
    yAxis: m.y,
    name: m.name,
    label: { formatter: m.name, position: 'insideEndTop' as const, fontSize: 11 },
    lineStyle: { type: 'dashed' as const, color: '#5b6b7a', width: 1.4 },
  }))
  const scatterMax = props.identityLine
    ? Math.max(0, ...props.series.flatMap((s) => s.data.map((p) => Math.max(p[0], p[1]))))
    : 0
  function pins(data: [number, number][]) {
    const e = extrema(data)
    if (!e) return []
    const pts: any[] = [
      { name: `最大 ${e.hi[1].toFixed(2)}`, coord: [e.hi[0], e.hi[1]], itemStyle: { color: '#D55E00' } },
      { name: `最小 ${e.lo[1].toFixed(2)}`, coord: [e.lo[0], e.lo[1]], itemStyle: { color: '#1565A8' } },
    ]
    if (Math.abs(e.jump) > e.range * 0.15) {
      pts.push({
        name: `跳变 ${e.jump > 0 ? '+' : ''}${e.jump.toFixed(2)}`,
        coord: [e.jumpAt[0], e.jumpAt[1]],
        itemStyle: { color: '#009E73' },
      })
    }
    return pts
  }
  return {
    backgroundColor: '#fff',
    color: COLORS,
    animation: false,
    legend: { top: 8, type: 'scroll', textStyle: { fontSize: 12, color: '#102a43' } },
    grid: { left: 64, right: props.y2Name ? 58 : 24, top: 56, bottom: time ? 72 : 48 },
    tooltip: {
      trigger: props.series.some((s) => s.type === 'scatter') ? 'item' : 'axis',
      formatter: (raw: any) => {
        const arr = Array.isArray(raw) ? raw : [raw]
        const t = Number(arr[0]?.value?.[0])
        const head = Number.isFinite(t) && t > 1e11 ? utcStamp(t) : ''
        const lines = arr.map((it: any) => {
          const y = Array.isArray(it.value) ? it.value[1] : it.value
          return `${it.marker || ''}${it.seriesName}: ${y == null ? '—' : Number(y).toFixed(3)}`
        })
        return [head, ...lines].filter(Boolean).join('<br/>')
      },
    },
    toolbox: {
      right: 8,
      feature: {
        dataZoom: time ? { yAxisIndex: 'none' } : {},
        restore: {},
        saveAsImage: { pixelRatio: 2, name: props.title || 'sfl-chart' },
      },
    },
    dataZoom: time
      ? [
          { type: 'inside', xAxisIndex: 0, filterMode: 'filter' },
          { type: 'slider', height: 18, bottom: 8, filterMode: 'filter' },
        ]
      : [],
    xAxis: {
      type: props.xType || 'time',
      name: props.xName || (time ? '时间' : ''),
      nameLocation: 'middle',
      nameGap: 26,
      min: time ? fromInput(from.value) : undefined,
      max: time ? fromInput(to.value) : undefined,
      axisLine: { lineStyle: { color: '#1d4e89', width: 1.2 } },
      splitLine: { show: !time, lineStyle: { color: '#d7e3ee', type: 'dashed' } },
      axisLabel: {
        fontSize: 11,
        color: '#334e68',
        formatter: (v: number) => (time && v > 1e11 ? utcDay(v) : String(v)),
      },
    },
    yAxis: [
      {
        type: 'value',
        name: props.yName,
        scale: !props.yFromZero,
        min: ymin,
        max: ymax,
        axisLine: { show: true, lineStyle: { color: '#1d4e89', width: 1.2 } },
        splitLine: { lineStyle: { color: '#d7e3ee', type: 'dashed' } },
        axisLabel: { fontSize: 11, formatter: (v: number) => Number(v).toFixed(2) },
      },
      {
        type: 'value',
        name: props.y2Name,
        show: !!props.y2Name,
        scale: true,
        min: y1.min,
        max: y1.max,
        axisLine: { show: true, lineStyle: { color: '#d55e00' } },
        splitLine: { show: false },
        axisLabel: { fontSize: 11, formatter: (v: number) => Number(v).toFixed(2) },
      },
    ],
    series: props.series.map((s, i) => ({
      name: s.name,
      type: s.type || 'line',
      showSymbol: s.type === 'scatter',
      symbolSize: s.type === 'scatter' ? 8 : 0,
      lineStyle: {
        width: s.dashed ? 1.8 : (s.thick === false ? 1.8 : 2.5),
        type: s.dashed ? 'dashed' : 'solid',
      },
      itemStyle: { color: s.color || COLORS[i % COLORS.length] },
      yAxisIndex: s.yAxisIndex || 0,
      barMaxWidth: s.barWidth || 8,
      data: s.data,
      large: false,
      markPoint: i === 0 && props.annotate && s.type !== 'bar'
        ? {
            symbol: 'pin',
            symbolSize: 42,
            label: {
              show: true,
              fontSize: 11,
              color: '#102a43',
              formatter: (p: any) => String(p.name || ''),
            },
            data: pins(s.data || []),
          }
        : undefined,
      markLine: i === 0 && (ml.length || props.identityLine)
        ? {
            silent: true,
            symbol: 'none',
            data: props.identityLine
              ? [[{ coord: [0, 0] }, { coord: [scatterMax, scatterMax] }]]
              : ml,
          }
        : undefined,
      markArea: i === 0 && pieces.length ? { silent: true, data: pieces.map((p) => [{ xAxis: p.xAxis, itemStyle: p.itemStyle }, { xAxis: p.x2 }]) } : undefined,
    })),
  }
}

function render() {
  if (!chart) return
  const has = props.series.some((s) => (s.data || []).length)
  if (!has) {
    chart.clear()
    return
  }
  chart.setOption(option(), true)
}

function applyVisibleY() {
  if (!chart) return
  const opt: any = chart.getOption()
  const dz = opt?.dataZoom?.[0]
  const a = Number(dz?.startValue)
  const b = Number(dz?.endValue)
  const x0 = fromInput(from.value) ?? (Number.isFinite(a) ? a : undefined)
  const x1 = fromInput(to.value) ?? (Number.isFinite(b) ? b : undefined)
  const y0 = axisBounds(0, x0, x1)
  const y1 = axisBounds(1, x0, x1)
  chart.setOption({
    yAxis: [
      {
        min: yMin.value === '' ? (props.yFromZero ? 0 : y0.min) : Number(yMin.value),
        max: yMax.value === '' ? (props.yFromZero ? Math.max(y0.max, y0.max * 1.12) : y0.max) : Number(yMax.value),
      },
      { min: y1.min, max: y1.max },
    ],
  })
}

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value, undefined, { renderer: 'canvas', devicePixelRatio: Math.max(2, window.devicePixelRatio || 1) })
  chart.on('datazoom', applyVisibleY)
  render()
  const ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value)
  onBeforeUnmount(() => {
    ro.disconnect()
    chart?.dispose()
    chart = null
  })
})

watch(() => [props.series, props.marks, yMin.value, yMax.value, from.value, to.value, props.yFromZero, props.annotate], render, { deep: true })

function reset() {
  yMin.value = ''
  yMax.value = ''
  from.value = ''
  to.value = ''
  chart?.dispatchAction({ type: 'restore' })
  render()
}
</script>

<template>
  <div>
    <div v-if="!compact" class="flex flex-wrap items-end gap-2 border-b border-line px-3 py-1.5 text-xs text-slate-600">
      <template v-if="xType !== 'value'">
        <label class="flex flex-col gap-0.5">起
          <input v-model="from" type="datetime-local" class="rounded border border-line px-2 py-1 tabular" />
        </label>
        <label class="flex flex-col gap-0.5">止
          <input v-model="to" type="datetime-local" class="rounded border border-line px-2 py-1 tabular" />
        </label>
      </template>
      <label class="flex flex-col gap-0.5">Y min
        <input v-model="yMin" type="number" step="any" class="w-20 rounded border border-line px-2 py-1 tabular" />
      </label>
      <label class="flex flex-col gap-0.5">Y max
        <input v-model="yMax" type="number" step="any" class="w-20 rounded border border-line px-2 py-1 tabular" />
      </label>
      <button type="button" class="rounded border border-line px-2 py-1" @click="reset">还原</button>
      <span class="ml-auto">框选放大 · 滚轮缩放</span>
    </div>
    <div ref="el" :style="{ height: height || '340px' }"></div>
  </div>
</template>
