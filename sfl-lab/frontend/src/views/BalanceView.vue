<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import LysimeterSchematic from '../components/LysimeterSchematic.vue'
import { api, refreshMeta, store } from '../state'
import { zipDaily } from '../lib/series'
import { readout } from '../lib/readout'

const bal = ref<any>(null)
const guess = ref({ precipMm: '', etMm: '', dsMm: '', drainMm: '' })
const compared = ref<any>(null)

async function load() {
  if (!store.sessionId) return
  try {
    const data = await api(`/api/sessions/${store.sessionId}/balance`)
    if (data?.held) return
    bal.value = data
    if (!compared.value) compared.value = { resumed: true }
  } catch (e: any) {
    store.error = e.message
  }
}

async function checkGuess() {
  if (!store.sessionId) return
  const filled = [guess.value.precipMm, guess.value.etMm, guess.value.dsMm, guess.value.drainMm]
  if (filled.some((v) => v === '' || !Number.isFinite(Number(v)))) {
    store.error = 'P、ET、ΔS、D 都要填数字。'
    return
  }
  try {
    compared.value = await api(`/api/sessions/${store.sessionId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        precipMm: Number(guess.value.precipMm),
        etMm: Number(guess.value.etMm),
        dsMm: Number(guess.value.dsMm),
        drainMm: Number(guess.value.drainMm),
      }),
    })
    await load()
    await refreshMeta()
  } catch (e: any) {
    store.error = e.message
  }
}

function exportDaily() {
  const rows = [['date', 'P', 'ET', 'D', 'dS', 'dS_profile', 'meteoP', 'ET0', 'closure']]
  for (const d of bal.value?.daily || []) {
    rows.push([d.date, d.p, d.et, d.d, d.ds, d.dsProfile ?? '', d.meteoP, d.et0 ?? '', d.closure])
  }
  const csv = rows.map((r) => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'sfl-lab-daily.csv'
  a.click()
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
    <div class="rounded-lg border-2 border-hydro bg-white p-5">
      <p class="text-xs font-semibold tracking-wide text-hydro">先估再揭</p>
      <h2 class="mt-1 text-lg">先写下 P、ET、ΔS、D（mm），再对照计算值</h2>
      <p class="mt-1 text-sm text-slate-600">泵和风振不要算进 P。无同期气象则 P 只来自称重门限。</p>
      <div class="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <label class="text-sm">P
          <input v-model="guess.precipMm" type="number" step="any" class="mt-1 w-full rounded border px-2 py-1 tabular" />
        </label>
        <label class="text-sm">ET
          <input v-model="guess.etMm" type="number" step="any" class="mt-1 w-full rounded border px-2 py-1 tabular" />
        </label>
        <label class="text-sm">ΔS
          <input v-model="guess.dsMm" type="number" step="any" class="mt-1 w-full rounded border px-2 py-1 tabular" />
        </label>
        <label class="text-sm">D
          <input v-model="guess.drainMm" type="number" step="any" class="mt-1 w-full rounded border px-2 py-1 tabular" />
        </label>
      </div>
      <button type="button" class="mt-3 rounded bg-hydro px-4 py-2 text-white" @click="checkGuess">对照计算值</button>
      <p v-if="compared && Math.abs(Number(bal?.totals?.closureMm)) > 2" class="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        课堂规则：闭合差超过 2 mm，先回旗标再写报告。这不是规范阈值。
      </p>
      <ul v-if="compared?.rows" class="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <li v-for="r in compared.rows" :key="r.key" :class="r.close ? 'text-slate-700' : 'text-amber-900'">
          {{ r.key.replace('Mm','') }} 估 {{ Number(r.guess).toFixed(2) }} / 算 {{ Number(r.calc).toFixed(2) }}
          {{ r.close ? '接近' : '差得远，回旗标' }}
        </li>
      </ul>
    </div>

    <template v-if="compared">
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
    <button type="button" class="rounded border border-navy px-4 py-2 text-navy" @click="exportDaily">导出日表 CSV</button>
    </template>
  </section>
</template>
