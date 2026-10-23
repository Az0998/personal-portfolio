<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import LysimeterSchematic from '../components/LysimeterSchematic.vue'
import { api, store } from '../state'
import { zipDaily } from '../lib/series'
import { readout } from '../lib/readout'

const bal = ref<any>(null)

async function load() {
  if (!store.sessionId) return
  try {
    bal.value = await api(`/api/sessions/${store.sessionId}/balance`)
  } catch (e: any) {
    store.error = e.message
  }
}
onMounted(load)
watch(() => store.sessionId, load)

function dailyPairs(key: string): [number, number][] {
  return (bal.value?.daily || []).map((d: any) => [Date.parse(d.date + 'T00:00:00Z'), d[key]])
}
function fluxPairs(key: string): [number, number][] {
  return (bal.value?.flux || []).map((f: any) => [f.t, f[key] || 0])
}
</script>

<template>
  <section class="space-y-5">
    <LysimeterSchematic
      :p="bal?.totals?.precipMm"
      :et="bal?.totals?.etMm"
      :d="bal?.totals?.drainMm"
      :ds="bal?.totals?.dsMm"
    />
    <dl v-if="bal?.totals" class="grid grid-cols-2 gap-2 text-sm tabular md:grid-cols-5">
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">P</dt><dd class="text-xl text-navy">{{ Number(bal.totals.precipMm).toFixed(2) }}</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">ET</dt><dd class="text-xl text-navy">{{ Number(bal.totals.etMm).toFixed(2) }}</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">D</dt><dd class="text-xl text-navy">{{ Number(bal.totals.drainMm).toFixed(2) }}</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">ΔS</dt><dd class="text-xl text-navy">{{ Number(bal.totals.dsMm).toFixed(2) }}</dd></div>
      <div class="rounded-lg border border-hydro bg-sky-50 p-3"><dt class="text-slate-500">闭合差</dt><dd class="text-xl text-hydro">{{ Number(bal.totals.closureMm).toFixed(2) }}</dd></div>
    </dl>

    <ChartFrame title="日降水与蒸散" kind="柱 + 线"
      :read="readout('柱=P，线=ET。雨日 ET 不可靠。', [{ name: 'P', type: 'bar', data: dailyPairs('p') }])">
      <AcademicChart compact title="" y-name="mm d⁻¹" :series="[
        { name: 'P', type: 'bar', data: dailyPairs('p') },
        { name: 'ET', data: dailyPairs('et') },
      ]" />
    </ChartFrame>
    <ChartFrame title="日储水变化与渗漏" kind="柱状"
      :read="readout('剖面ΔS 只对照，不替代称重。', [{ name: 'ΔS', type: 'bar', data: dailyPairs('ds') }])">
      <AcademicChart compact title="" y-name="mm d⁻¹" :series="[
        { name: 'ΔS', type: 'bar', data: dailyPairs('ds') },
        { name: 'D', type: 'bar', data: dailyPairs('d') },
        { name: '剖面ΔS', dashed: true, data: dailyPairs('dsProfile') },
      ]" />
    </ChartFrame>
    <ChartFrame
      v-if="store.meta?.coverage?.weightWeather && bal?.daily?.some((d:any)=>d.meteoP>0)"
      title="称重降水 vs 气象降水"
      kind="1:1 散点"
      :read="readout('应靠近斜线。偏高查风振当雨。', [{ name: '日值', type: 'scatter', data: zipDaily(bal.daily, 'p', 'meteoP') }])"
    >
      <AcademicChart compact title="" y-name="气象 P (mm)" x-name="称重 P (mm)" x-type="value" identity-line y-from-zero height="300px"
        :series="[{ name: '日值', type: 'scatter', data: zipDaily(bal.daily, 'p', 'meteoP') }]" />
    </ChartFrame>
    <ChartFrame title="10 min 过门限增量" kind="事件柱"
      :read="readout('只辨雨。负柱不是 ET。', [{ name: '过门限增重', type: 'bar', data: fluxPairs('precip') }])">
      <AcademicChart compact title="" y-name="mm / 10 min" height="220px"
        :series="[{ name: '过门限增重', type: 'bar', data: fluxPairs('precip') }]" />
    </ChartFrame>

    <p v-if="store.meta?.coverage?.weightWeather === false" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">气象错位，气象P / ET0 列作废。</p>
    <p v-if="bal && !(bal.daily || []).length" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">日表空。重新上传。</p>
    <table class="data-table">
      <thead>
        <tr><th>日期</th><th>P</th><th>ET</th><th>D</th><th>ΔS</th><th>剖面ΔS</th><th>气象P</th><th>ET0</th><th>闭合</th></tr>
      </thead>
      <tbody>
        <tr v-if="!(bal?.daily || []).length"><td colspan="9" class="text-slate-500">没有日值</td></tr>
        <tr v-for="d in bal?.daily || []" :key="d.date">
          <td>{{ d.date }}</td>
          <td>{{ Number(d.p).toFixed(2) }}</td>
          <td>{{ Number(d.et).toFixed(2) }}</td>
          <td>{{ Number(d.d).toFixed(2) }}</td>
          <td>{{ Number(d.ds).toFixed(2) }}</td>
          <td>{{ d.dsProfile == null ? '—' : Number(d.dsProfile).toFixed(2) }}</td>
          <td>{{ Number(d.meteoP).toFixed(2) }}</td>
          <td>{{ d.et0 == null || Number.isNaN(d.et0) ? '—' : Number(d.et0).toFixed(2) }}</td>
          <td>{{ Number(d.closure).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
