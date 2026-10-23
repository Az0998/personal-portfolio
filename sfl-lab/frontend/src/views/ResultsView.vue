<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import PapersStrip from '../components/PapersStrip.vue'
import { api, store } from '../state'
import { toPairs, zipDaily } from '../lib/series'
import { readout } from '../lib/readout'

const probe = ref<any>(null)
const weather = ref<any>(null)
const bal = ref<any>(null)

async function load() {
  if (!store.sessionId) return
  try {
    probe.value = await api(`/api/sessions/${store.sessionId}/series?group=probe&maxPoints=2000`)
    weather.value = await api(`/api/sessions/${store.sessionId}/series?group=weather&maxPoints=2000`)
    bal.value = await api(`/api/sessions/${store.sessionId}/balance`)
  } catch (e: any) {
    store.error = e.message
  }
}
onMounted(load)
watch(() => store.sessionId, load)

function daily(key: string) {
  return (bal.value?.daily || []).map((d: any) => [Date.parse(d.date + 'T00:00:00Z'), d[key]])
}
const hasWeather = computed(() => (weather.value?.n || 0) > 2 && store.meta?.coverage?.weightWeather !== false)
const thetaT = computed(() => {
  if (!probe.value) return [] as [number, number][]
  const t = probe.value.series.temp1 || []
  const y = probe.value.series.echo1 || []
  const out: [number, number][] = []
  for (let i = 0; i < t.length; i++) {
    if (Number.isFinite(Number(t[i])) && Number.isFinite(Number(y[i]))) out.push([t[i], y[i]])
  }
  return out
})
function layer(key: string) {
  return toPairs(probe.value?.t, probe.value?.series?.[key])
}
function rangeOf(key: string) {
  const y = probe.value?.series?.[key] || []
  const v = y.filter((x: number) => Number.isFinite(Number(x))).map(Number)
  if (!v.length) return 0
  return Math.max(...v) - Math.min(...v)
}
</script>

<template>
  <section class="space-y-8">
    <p class="rounded-lg border border-line bg-white p-4 text-sm leading-7 text-slate-700">
      浅层先湿；θ 跟土温假抖就订正。无同期气象跳过雨量对照。
    </p>
    <PapersStrip topic="temp" />

    <p v-if="!(store.meta?.probeRows > 0)" class="rounded border border-line bg-white px-4 py-3 text-sm">无探头，跳过剖面。</p>
    <section v-else class="space-y-4">
      <h2 class="text-lg">① 剖面滞后</h2>
      <div class="grid gap-4 lg:grid-cols-3">
        <ChartFrame title="15 cm 含水量" kind="时间序列"
          :read="readout('应先抬。虚线=订正前。', [{ name: '订正', data: layer('echo1c') }])">
          <AcademicChart compact title="" y-name="θ (%)" height="220px"
            :series="[{ name: '订正', data: layer('echo1c') }, { name: '原始', dashed: true, data: layer('echo1') }]"
            :marks="probe?.marks || []" />
        </ChartFrame>
        <ChartFrame title="35 cm 含水量" kind="时间序列"
          :read="readout('常滞后或不动。', [{ name: '订正', data: layer('echo2c') }])">
          <AcademicChart compact title="" y-name="θ (%)" height="220px"
            :series="[{ name: '订正', data: layer('echo2c') }, { name: '原始', dashed: true, data: layer('echo2') }]" />
        </ChartFrame>
        <ChartFrame title="55 cm 含水量" kind="时间序列"
          :read="readout('应更晚。三层同跳=温度。', [{ name: '订正', data: layer('echo3c') }])">
          <AcademicChart compact title="" y-name="θ (%)" height="220px"
            :series="[{ name: '订正', data: layer('echo3c') }, { name: '原始', dashed: true, data: layer('echo3') }]" />
        </ChartFrame>
        <ChartFrame title="15 cm 土温" kind="时间序列" :read="readout('日振幅最大，配对订正。', [{ name: 'T', data: layer('temp1') }])">
          <AcademicChart compact title="" y-name="°C" height="220px" :series="[{ name: 'T', data: layer('temp1') }]" />
        </ChartFrame>
        <ChartFrame title="35 cm 土温" kind="时间序列" :read="readout('振幅小于浅层。', [{ name: 'T', data: layer('temp2') }])">
          <AcademicChart compact title="" y-name="°C" height="220px" :series="[{ name: 'T', data: layer('temp2') }]" />
        </ChartFrame>
        <ChartFrame title="55 cm 土温" kind="时间序列" :read="readout('深层温度最稳。', [{ name: 'T', data: layer('temp3') }])">
          <AcademicChart compact title="" y-name="°C" height="220px" :series="[{ name: 'T', data: layer('temp3') }]" />
        </ChartFrame>
      </div>
      <ChartFrame
        v-if="rangeOf('ec1') > 0.03 || rangeOf('ec2') > 0.03 || rangeOf('ec3') > 0.03"
        title="三层电导率"
        kind="时间序列"
        :read="readout('随入渗离子锋变。变幅太小则隐藏。', [{ name: '15 cm', data: layer('ec1') }])"
      >
        <AcademicChart compact title="" y-name="mS cm⁻¹" height="240px"
          :series="[
            { name: '15 cm', data: layer('ec1') },
            { name: '35 cm', data: layer('ec2') },
            { name: '55 cm', data: layer('ec3') },
          ]" />
      </ChartFrame>
    </section>

    <section v-if="store.meta?.probeRows > 0" class="space-y-4">
      <h2 class="text-lg">② 水势工作区</h2>
      <ChartFrame title="MPS / VTENS" kind="时间序列 + 工作界"
        :read="readout('−10 近饱和，−500 下限。贴顶或出界不可信。', [{ name: 'MPS 15 cm', data: layer('mps1') }])">
        <AcademicChart compact title="" y-name="kPa" height="320px"
          :mark-lines="[{ y: -10, name: '−10 近饱和' }, { y: -500, name: '−500 下限' }]"
          :series="[
            { name: 'MPS 15 cm', data: layer('mps1') },
            { name: 'MPS 35 cm', data: layer('mps2') },
            { name: 'MPS 55 cm', data: layer('mps3') },
            { name: 'VTENS', data: layer('vtens') },
          ]" />
      </ChartFrame>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg">③ 交叉检验</h2>
      <ChartFrame v-if="store.meta?.probeRows > 0" title="浅层 θ 对土温" kind="散点"
        :read="readout('沿温度拉长=介电假湿。', [{ name: '15 cm', type: 'scatter', data: thetaT }])">
        <AcademicChart compact title="" y-name="θ (%)" x-name="T (°C)" x-type="value" height="300px"
          :series="[{ name: '15 cm', type: 'scatter', data: thetaT }]" />
      </ChartFrame>
      <PapersStrip topic="et0" />
      <ChartFrame
        v-if="hasWeather && bal?.daily?.length"
        title="日尺度：称重 P、气象 P、ETa"
        kind="柱 + 线"
        :read="readout('柱应对齐。ET0 不是 ETa。', [{ name: 'Lysimeter P', type: 'bar', data: daily('p') }])"
      >
        <AcademicChart compact title="" y-name="mm d⁻¹"
          :series="[
            { name: 'Lysimeter P', type: 'bar', data: daily('p') },
            { name: 'z6 P', type: 'bar', data: daily('meteoP') },
            { name: 'ETa', data: daily('et') },
          ]" />
      </ChartFrame>
      <ChartFrame
        v-if="hasWeather && bal?.daily?.some((d:any)=>Number(d.et0)>0)"
        title="ETa vs ET0"
        kind="1:1 散点"
        :read="readout('点在斜线下常见：土柱未必充分供水。', [{ name: '日值', type: 'scatter', data: zipDaily(bal.daily, 'et', 'et0') }])"
      >
        <AcademicChart compact title="" y-name="ET0" x-name="ETa" x-type="value" identity-line height="280px"
          :series="[{ name: '日值', type: 'scatter', data: zipDaily(bal.daily, 'et', 'et0') }]" />
      </ChartFrame>
      <p v-if="!hasWeather || store.meta?.coverage?.weightWeather === false" class="rounded border border-line bg-white px-4 py-3 text-sm text-slate-600">无同期气象，跳过雨量交叉。</p>
    </section>
  </section>
</template>
