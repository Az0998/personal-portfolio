<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import { api, store } from '../state'
import { toPairs } from '../lib/series'
import { readout } from '../lib/readout'

const weight = ref<any>(null)
const probe = ref<any>(null)
const show = ref({ spike: true, wind: true, wall: true, step: true, bottle: true, pump: true, missing: true })

async function load() {
  if (!store.sessionId) return
  store.loading = true
  try {
    weight.value = await api(`/api/sessions/${store.sessionId}/series?group=weight&maxPoints=2400`)
    probe.value = await api(`/api/sessions/${store.sessionId}/series?group=probe&maxPoints=2000`)
  } catch (e: any) {
    store.error = e.message
  } finally {
    store.loading = false
  }
}
onMounted(load)
watch(() => store.sessionId, load)

function marks() {
  return (weight.value?.marks || []).filter((m: any) => (show as any).value[m.code] !== false)
}
function probeMarks() {
  return probe.value?.marks || []
}

const lywAnom = computed(() => toPairs(weight.value?.t, weight.value?.series?.lywAnomMm))
function spanEvents(ev: [number, number][]): [number, number][] {
  const t = weight.value?.t
  if (!t?.length) return ev
  return [[t[0], 0], ...ev, [t[t.length - 1], 0]]
}
const pumpRaw = computed(() => weight.value?.pumpEvents || [])
const pumpInEv = computed(() => spanEvents(pumpRaw.value.filter((e: any) => e.in > 0).map((e: any) => [e.t, e.in] as [number, number])))
const pumpOutEv = computed(() => spanEvents(pumpRaw.value.filter((e: any) => e.out > 0).map((e: any) => [e.t, e.out] as [number, number])))
const pumpInf = computed(() => spanEvents(pumpRaw.value.filter((e: any) => e.inferred).map((e: any) => [e.t, 1] as [number, number])))
const pumpEmpty = computed(() => pumpRaw.value.length === 0)
const swwAnom = computed(() => toPairs(weight.value?.t, weight.value?.series?.swwAnomMm))
const lyw = computed(() => toPairs(weight.value?.t, weight.value?.series?.lyw))
const echo = (k: string) => toPairs(probe.value?.t, probe.value?.series?.[k])
</script>

<template>
  <section class="space-y-5">
    <p v-if="!store.sessionId" class="rounded border border-line bg-white px-4 py-3 text-sm">回到「1 接入」上传或载入示例。</p>
    <p v-else-if="weight && !(weight.n > 0)" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">称重为空。检查 Timestamp 与 L1_LYW。</p>
    <div class="flex flex-wrap gap-3 text-sm">
      <label v-for="k in Object.keys(show)" :key="k" class="flex items-center gap-1">
        <input v-model="(show as any)[k]" type="checkbox" /> {{ k }}
      </label>
    </div>

    <ChartFrame
      title="质量距平（相对起点，mm）"
      kind="时间序列 · 距平"
      :read="readout('mm 级涨落。色带：尖峰/风振/泵，不当雨。', [{ name: '蒸渗桶', data: lywAnom }])"
    >
      <AcademicChart
        v-if="weight"
        title=""
        y-name="距平 (mm)"
        compact
        height="380px"
        :series="[
          { name: '蒸渗桶', data: lywAnom, thick: true },
          { name: '补水桶', data: swwAnom, dashed: true },
        ]"
        :marks="marks()"
      />
    </ChartFrame>

    <ChartFrame
      title="原始质量（轴贴合变幅）"
      kind="双轴时间序列"
      :read="readout('轴贴合变幅。SWW 水平=补水桶未动。', [{ name: 'LYW', data: lyw }])"
    >
      <AcademicChart
        v-if="weight"
        title=""
        y-name="LYW (kg)"
        y2-name="SWW (kg)"
        compact
        :series="[
          { name: 'LYW', data: lyw },
          { name: 'SWW', data: toPairs(weight.t, weight.series.sww), yAxisIndex: 1 },
        ]"
        :marks="marks()"
      />
    </ChartFrame>

    <ChartFrame
      title="泵与内部调水"
      kind="事件柱"
      :read="weight?.pumpNote || readout('有柱才是内部调水。', [{ name: 'Pump_in', type: 'bar', data: pumpInEv }])"
    >
      <p v-if="pumpEmpty" class="px-4 py-8 text-center text-sm text-slate-600">
        泵秒全 0，也无 LYW–SWW 互补。本段无内部调水。
      </p>
      <AcademicChart
        v-else
        title=""
        y-name="s / min"
        y-from-zero
        compact
        height="220px"
        :series="[
          { name: 'Pump_in', type: 'bar', data: pumpInEv },
          { name: 'Pump_out', type: 'bar', data: pumpOutEv },
          { name: '推断调水', type: 'scatter', data: pumpInf, color: '#6D28D9' },
        ]"
      />
    </ChartFrame>

    <p v-if="store.meta && !(store.meta.probeRows > 0)" class="rounded border border-line bg-white px-4 py-3 text-sm">无探头，跳过剖面。</p>
    <p v-else-if="store.meta && store.meta.coverage && store.meta.coverage.weightProbe === false" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">探头与称重时段错开，θ 不能解释质量。</p>
    <template v-if="store.meta?.probeRows > 0">
    <h3 class="text-base">三层 θ · 色带 = 无雨抬升 / 日周期 / 层序反常</h3>
    <div class="grid gap-4">
      <ChartFrame title="15 cm 浅层" kind="时间序列" :read="readout('应先接雨。色带：日周期或无雨台阶，不是入渗。', [{ name: '15 cm', data: echo('echo1') }])">
        <AcademicChart compact title="" y-name="θ (%)" height="240px" :series="[{ name: '15 cm', data: echo('echo1') }]" :marks="probeMarks()" />
      </ChartFrame>
      <ChartFrame title="35 cm 中层" kind="时间序列" :read="readout('变幅通常小。先于浅层抬=层序反了。', [{ name: '35 cm', data: echo('echo2') }])">
        <AcademicChart compact title="" y-name="θ (%)" height="240px" :series="[{ name: '35 cm', data: echo('echo2') }]" :marks="probeMarks()" />
      </ChartFrame>
      <ChartFrame title="55 cm 深层" kind="时间序列" :read="readout('应滞后。与浅层同跳先当温度。', [{ name: '55 cm', data: echo('echo3') }])">
        <AcademicChart compact title="" y-name="θ (%)" height="240px" :series="[{ name: '55 cm', data: echo('echo3') }]" :marks="probeMarks()" />
      </ChartFrame>
    </div>
    </template>
  </section>
</template>
