<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import HeatmapChart from '../components/HeatmapChart.vue'
import PapersStrip from '../components/PapersStrip.vue'
import { api, refreshMeta, store } from '../state'
import { hourlyHeat, hourlyMean, lagBars, minus, toPairs } from '../lib/series'
import { readout } from '../lib/readout'

const tab = ref<'temp' | 'filter'>('temp')
const temp = ref<any>(null)
const probe = ref<any>(null)
const cmp = ref<any>(null)
const form = ref({
  filter: 'MA',
  maWindow: 11,
  wmax: 31,
  deltaMax: 0.2,
  snap: true,
  interp: 'LINEAR',
  tempMethod: 'B',
  tref: 20,
  useRainMask: false,
})
const showF = ref({ raw: true, MA: true, LINEAR: true, AWAT: true, NONE: false })

const methods = [
  { id: 'NONE', title: '不滤波', text: '只删尖峰/风振/泵。' },
  { id: 'MA', title: '滑动平均', text: '11 min 均值，雨峰被抹矮。' },
  { id: 'LINEAR', title: '线性插值', text: '只填缺口。' },
  { id: 'AWAT', title: 'AWAT', text: '小抖吃掉，过阈才当通量。' },
]

const residHeat = computed(() => {
  if (!probe.value) return null
  const raw = probe.value.series.echo1 || []
  const cor = probe.value.series.echo1c || []
  const resid = raw.map((v: number, i: number) => {
    const a = Number(v), b = Number(cor[i])
    return Number.isFinite(a) && Number.isFinite(b) ? a - b : NaN
  })
  return hourlyHeat(probe.value.t, resid)
})

const fitLine = computed(() => {
  const L = temp.value?.layers?.[0]
  if (!L) return [] as [number, number][]
  const used = (L.scatter || []).filter((p: any) => p.used)
  const xs = used.map((p: any) => Number(p.x)).filter(Number.isFinite)
  if (!xs.length) return []
  return [[0, 0], [Math.max(...xs), Number(L.alpha) * Math.max(...xs)]] as [number, number][]
})

function overlay() {
  if (!cmp.value) return []
  const t = cmp.value.t
  const s = cmp.value.series || {}
  const out: any[] = []
  if (showF.value.raw) out.push({ name: '原始', data: toPairs(t, s.raw), dashed: true, thick: false })
  for (const id of ['NONE', 'MA', 'LINEAR', 'AWAT'] as const) {
    if (showF.value[id]) out.push({ name: id, data: toPairs(t, s[id]), thick: id === form.value.filter })
  }
  return out
}

function residualOf(id: string) {
  if (!cmp.value) return []
  const t = cmp.value.t
  const raw = cmp.value.series.raw || []
  const y = cmp.value.series[id] || []
  return minus(t, raw, y)
}

async function loadCompare() {
  if (!store.sessionId || cmp.value) return
  cmp.value = await api(`/api/sessions/${store.sessionId}/filters/compare`)
}

async function load() {
  if (!store.sessionId) return
  temp.value = await api(`/api/sessions/${store.sessionId}/temp`)
  probe.value = await api(`/api/sessions/${store.sessionId}/series?group=probe&maxPoints=2000`)
  if (tab.value === 'filter') await loadCompare()
}

async function rerun() {
  store.loading = true
  try {
    store.meta = await api(`/api/sessions/${store.sessionId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    cmp.value = null
    await load()
  } catch (e: any) {
    store.error = e.message
  } finally {
    store.loading = false
  }
}

async function boot() {
  store.loading = true
  try {
    await refreshMeta()
    cmp.value = null
    await load()
  } catch (e: any) {
    store.error = e.message
  } finally {
    store.loading = false
  }
}
onMounted(boot)
watch(() => store.sessionId, boot)
</script>

<template>
  <section class="space-y-4">
    <div class="flex gap-2">
      <button type="button" class="rounded px-3 py-1.5 text-sm" :class="tab==='temp' ? 'bg-hydro text-white' : 'border border-line'" @click="tab='temp'">4A 温度订正</button>
      <button type="button" class="rounded px-3 py-1.5 text-sm" :class="tab==='filter' ? 'bg-hydro text-white' : 'border border-line'" @click="tab='filter'; loadCompare()">4B 称重滤波</button>
    </div>
    <PapersStrip :topic="tab==='temp' ? 'temp' : 'filter'" />

    <form class="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-white p-3 text-sm" @submit.prevent="rerun">
      <label>方法
        <select v-model="form.tempMethod" class="ml-1 rounded border px-2 py-1"><option>A</option><option>B</option><option>C</option></select>
      </label>
      <label>Tref<input v-model.number="form.tref" type="number" class="ml-1 w-16 rounded border px-2 py-1 tabular" /></label>
      <label class="flex items-center gap-1"><input v-model="form.useRainMask" type="checkbox" /> 雨日不拟合 α</label>
      <label>写入水平衡的滤波
        <select v-model="form.filter" class="ml-1 rounded border px-2 py-1">
          <option value="NONE">无</option>
          <option value="MA">滑动平均</option>
          <option value="LINEAR">线性插值</option>
          <option value="AWAT">AWAT</option>
        </select>
      </label>
      <label>MA 窗<input v-model.number="form.maWindow" type="number" class="ml-1 w-16 rounded border px-2 py-1 tabular" /></label>
      <button class="rounded bg-hydro px-3 py-1.5 text-white" type="submit">重新计算</button>
    </form>

    <div v-if="tab==='temp'" class="space-y-4">
      <p v-if="!(store.meta?.probeRows > 0)" class="rounded border border-line bg-white px-4 py-3 text-sm">无探头，跳过 4A。滤波仍可做。</p>
      <table class="data-table">
        <thead><tr><th>层</th><th>α</th><th>拟合日</th><th>剔除日</th><th>日均θ变化 %</th></tr></thead>
        <tbody>
          <tr v-if="!(temp?.layers || []).length"><td colspan="5" class="text-slate-500">没有层参数</td></tr>
          <tr v-for="L in temp?.layers || []" :key="L.layer">
            <td>{{ L.label }}</td>
            <td>{{ Number(L.alpha).toFixed(4) }}</td>
            <td>{{ L.daysUsed }}</td>
            <td>{{ L.daysDropped }}</td>
            <td>{{ Number(L.relChangePct).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <ChartFrame title="订正对比 · 15 cm" kind="叠加时间序列"
        :read="readout('白天峰应被压低；雨后一起抬才是入渗。', [{ name: '订正', data: toPairs(probe?.t, probe?.series?.echo1c) }])">
        <AcademicChart compact title="" y-name="θ (%)" height="320px"
          :series="[
            { name: '原始', data: toPairs(probe?.t, probe?.series?.echo1), dashed: true },
            { name: '订正', data: toPairs(probe?.t, probe?.series?.echo1c) },
          ]" />
      </ChartFrame>
      <ChartFrame title="订正残差（原始 − 订正）" kind="残差柱"
        :read="readout('白天正、夜间负。无日周期则 α≈0。', [{ name: '残差', type: 'bar', data: minus(probe?.t || [], probe?.series?.echo1 || [], probe?.series?.echo1c || []) }])">
        <AcademicChart compact title="" y-name="Δθ (%)" height="240px"
          :series="[{ name: '残差', type: 'bar', data: minus(probe?.t || [], probe?.series?.echo1 || [], probe?.series?.echo1c || []) }]" />
      </ChartFrame>
      <div class="grid gap-4 lg:grid-cols-2">
        <ChartFrame title="各小时平均 θ" kind="日周期"
          :read="readout('订正后应更平。', [{ name: '原始', data: hourlyMean(probe?.t, probe?.series?.echo1) }])">
          <AcademicChart compact title="" y-name="θ (%)" x-name="小时" x-type="value" height="260px"
            :series="[
              { name: '原始', data: hourlyMean(probe?.t, probe?.series?.echo1) },
              { name: '订正', data: hourlyMean(probe?.t, probe?.series?.echo1c) },
            ]" />
        </ChartFrame>
        <ChartFrame title="Ah = α · hd · AT" kind="散点 + 斜率"
          :read="readout('实心拟合，空心剔除。斜率=α。', [{ name: '拟合日', type: 'scatter', data: (temp?.layers?.[0]?.scatter||[]).filter((p:any)=>p.used).map((p:any)=>[p.x,p.y]) }])">
          <AcademicChart compact title="" y-name="Ah" x-name="hd · AT" x-type="value" height="260px"
            :series="[
              { name: '拟合日', type: 'scatter', data: (temp?.layers?.[0]?.scatter||[]).filter((p:any)=>p.used).map((p:any)=>[p.x,p.y]) },
              { name: '剔除', type: 'scatter', data: (temp?.layers?.[0]?.scatter||[]).filter((p:any)=>!p.used).map((p:any)=>[p.x,p.y]) },
              { name: 'α 斜率', data: fitLine, dashed: true },
            ]" />
        </ChartFrame>
      </div>
      <ChartFrame v-if="residHeat" title="残差热图" kind="小时 × 日期"
        :read="'竖条纹=日周期还在。订正后应变淡。'">
        <HeatmapChart title="" :hours="residHeat.hours" :days="residHeat.days" :data="residHeat.data" height="280px" />
      </ChartFrame>
    </div>

    <div v-else class="space-y-4">
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <button v-for="m in methods" :key="m.id" type="button"
          class="rounded-lg border p-3 text-left text-sm"
          :class="showF[m.id as keyof typeof showF] ? 'border-hydro bg-sky-50' : 'border-line bg-white'"
          @click="showF[m.id as keyof typeof showF] = !showF[m.id as keyof typeof showF]">
          <p class="font-medium text-navy">{{ m.title }}</p>
          <p class="mt-1 leading-6 text-slate-600">{{ m.text }}</p>
        </button>
      </div>
      <p class="text-sm text-slate-600">全序列几乎重合是正常的，差别看残差表。</p>
      <table class="data-table">
        <thead><tr><th>方法</th><th>对原始 RMSE (mm)</th><th>最大|残差|</th><th>6 h 峰高</th><th>相对原始丢掉的峰</th></tr></thead>
        <tbody>
          <tr v-if="!(cmp?.stats || []).length"><td colspan="5" class="text-slate-500">正在对比…</td></tr>
          <tr v-for="r in cmp?.stats || []" :key="r.id" :class="r.id===form.filter ? 'bg-sky-50' : ''">
            <td>{{ r.id }}</td>
            <td>{{ Number(r.rmse).toFixed(4) }}</td>
            <td>{{ Number(r.maxAbs).toFixed(3) }}</td>
            <td>{{ Number(r.peak6h).toFixed(2) }}</td>
            <td>{{ Number(r.peakLost).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-sm text-slate-600">{{ cmp?.note }}</p>
      <ChartFrame title="残差（原始 − 方法）· 这才是差别" kind="残差对比"
        :read="readout('MA 抹雨沿；AWAT 吃小抖；LINEAR 近零。', [{ name: 'MA', data: toPairs(cmp?.t, cmp?.series?.resMA) }])">
        <AcademicChart title="" y-name="mm" height="300px"
          :series="[
            { name: 'MA', data: toPairs(cmp?.t, cmp?.series?.resMA) },
            { name: 'LINEAR', data: toPairs(cmp?.t, cmp?.series?.resLINEAR), dashed: true },
            { name: 'AWAT', data: toPairs(cmp?.t, cmp?.series?.resAWAT) },
          ]" />
      </ChartFrame>
      <ChartFrame title="四种滤波叠在系统重量上（全时段会几乎重合）" kind="对比时间序列"
        :read="readout('滚到雨沿再比。', overlay())">
        <AcademicChart title="" y-name="mm" height="320px" :series="overlay()" />
      </ChartFrame>
    </div>
  </section>
</template>
