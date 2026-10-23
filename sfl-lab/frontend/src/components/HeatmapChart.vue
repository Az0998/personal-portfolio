<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  title: string
  hours: string[]
  days: string[]
  data: [number, number, number][]
  height?: string
}>()

const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function render() {
  if (!chart) return
  const vals = props.data.map((d) => d[2]).filter(Number.isFinite)
  const vmin = vals.length ? Math.min(...vals) : 0
  const vmax = vals.length ? Math.max(...vals) : 1
  chart.setOption({
    backgroundColor: '#fff',
    title: { text: props.title, left: 8, top: 4, textStyle: { fontSize: 13, fontWeight: 600 } },
    tooltip: { formatter: (p: any) => `${props.days[p.data[1]]} ${p.data[0]}时：${Number(p.data[2]).toFixed(3)}` },
    grid: { left: 52, right: 48, top: 40, bottom: 36 },
    xAxis: { type: 'category', data: props.hours, name: '小时 (UTC)', nameGap: 22, nameLocation: 'middle' },
    yAxis: { type: 'category', data: props.days, name: '日期', inverse: true },
    visualMap: {
      min: vmin,
      max: vmax,
      calculable: true,
      orient: 'vertical',
      right: 4,
      top: 40,
      inRange: { color: ['#f7f3ea', '#d55e00'] },
    },
    series: [{ type: 'heatmap', data: props.data, emphasis: { itemStyle: { shadowBlur: 4 } } }],
  }, true)
}

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  render()
  const ro = new ResizeObserver(() => chart?.resize())
  ro.observe(el.value)
  onBeforeUnmount(() => {
    ro.disconnect()
    chart?.dispose()
    chart = null
  })
})
watch(() => [props.data, props.days], render, { deep: true })
</script>

<template>
  <section class="rounded-md border border-line bg-white">
    <div ref="el" :style="{ height: height || '280px' }"></div>
  </section>
</template>
