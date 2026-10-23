<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import { api, store } from '../state'
import { fmtTime } from '../state'
import { flagScatter } from '../lib/readout'
import { toPairs } from '../lib/series'

const stream = ref('weight')
const page = ref(0)
const onlyFlagged = ref(true)
const reasonFilter = ref('')
const table = ref<any>({ rows: [], total: 0 })
const sum = ref<any>(null)
const curve = ref<any>(null)
const edit = ref({ reason: '人工检查' })

const reasonRows = computed(() => {
  const r = sum.value?.reasons || {}
  return Object.entries(r)
    .map(([k, v]) => ({ name: k, n: v as number }))
    .sort((a, b) => b.n - a.n)
})

async function load() {
  if (!store.sessionId) return
  try {
    table.value = await api(`/api/sessions/${store.sessionId}/flags?stream=${stream.value}&page=${page.value}&size=60&onlyFlagged=${onlyFlagged.value}`)
    sum.value = await api(`/api/sessions/${store.sessionId}/flags/summary?stream=${stream.value}`)
    curve.value = await api(`/api/sessions/${store.sessionId}/series?group=${stream.value === 'probe' ? 'probe' : 'weight'}&maxPoints=2000`)
  } catch (e: any) {
    store.error = e.message
    table.value = { rows: [], total: 0 }
  }
}

async function save(row: any) {
  await api(`/api/sessions/${store.sessionId}/flags`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stream: stream.value, t: row.t, flag: Number(row.flag), reason: edit.value.reason }),
  })
  await load()
}

const shownRows = computed(() => {
  const rows = table.value.rows || []
  if (!reasonFilter.value) return rows
  return rows.filter((r: any) => String(r.reason).includes(reasonFilter.value))
})

onMounted(load)
watch(stream, () => {
  sum.value = null
  curve.value = null
  table.value = { rows: [], total: 0 }
})
watch([() => store.sessionId, stream, page, onlyFlagged], load)
</script>

<template>
  <section class="space-y-5">
    <p class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      宁可多标。无雨 θ 台阶、日周期、深层先动进表。无同期雨量时「无雨」只按称重门限。
    </p>
    <div class="grid gap-3 md:grid-cols-3">
      <div class="rounded-lg border border-line bg-white p-4">
        <p class="text-xs text-slate-500">0 正确</p>
        <p class="text-3xl tabular text-navy">{{ sum?.n0 ?? '—' }}</p>
        <p class="mt-1 text-sm text-slate-600">过门限才记雨，缓慢减重才是 ET。</p>
      </div>
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="text-xs text-amber-800">1 可疑</p>
        <p class="text-3xl tabular text-amber-900">{{ sum?.n1 ?? '—' }}</p>
        <p class="mt-1 text-sm text-slate-600">风振、碰壁、泵、台阶：跳变不像雨。</p>
      </div>
      <div class="rounded-lg border border-red-200 bg-red-50 p-4">
        <p class="text-xs text-red-800">2 错误</p>
        <p class="text-3xl tabular text-red-900">{{ sum?.n2 ?? '—' }}</p>
        <p class="mt-1 text-sm text-slate-600">缺测、尖峰、哨兵值。表里可改。</p>
      </div>
    </div>

    <ChartFrame
      :title="stream === 'probe' ? '异常点打在 15 cm θ 上' : '异常点打在质量距平上'"
      kind="时间序列 + 散点"
      :read="'橙=可疑，红=错误。改表即重画。'"
    >
      <AcademicChart
        v-if="curve && sum"
        compact
        title=""
        :y-name="stream === 'probe' ? 'θ (%)' : '距平 (mm)'"
        height="340px"
        :series="[
          { name: stream === 'probe' ? '15 cm' : '距平', data: toPairs(curve.t, stream === 'probe' ? curve.series.echo1 : curve.series.lywAnomMm) },
          { name: '可疑', type: 'scatter', data: flagScatter(sum.points || [], 1), color: '#D55E00' },
          { name: '错误', type: 'scatter', data: flagScatter(sum.points || [], 2), color: '#B91C1C' },
        ]"
      />
    </ChartFrame>

    <div class="rounded-lg border border-line bg-white p-4">
      <p class="text-sm text-slate-600">哪条规则占得最多，优先检查那一类。全程偏移的探头状态不会刷满整表。</p>
      <ul class="mt-3 space-y-2">
        <li v-for="r in reasonRows" :key="r.name" class="grid grid-cols-[1fr_3rem] items-center gap-2 text-sm">
          <div>
            <p>{{ r.name }}</p>
            <span class="mt-1 block h-2 overflow-hidden rounded bg-slate-100">
              <span class="block h-2 bg-hydro" :style="{ width: Math.min(100, (100 * r.n) / Math.max(1, reasonRows[0]?.n || 1)) + '%' }" />
            </span>
          </div>
          <span class="tabular text-right">{{ r.n }}</span>
        </li>
        <li v-if="!reasonRows.length" class="text-sm text-slate-500">当前没有 1/2 旗标。</li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-2 text-sm">
      <button class="rounded px-3 py-1" :class="stream==='weight'?'bg-hydro text-white':'border'" @click="stream='weight'; page=0">称重</button>
      <button class="rounded px-3 py-1" :class="stream==='probe'?'bg-hydro text-white':'border'" @click="stream='probe'; page=0">探头</button>
      <label class="flex items-center gap-1"><input v-model="onlyFlagged" type="checkbox" @change="page=0" /> 只看 1/2</label>
      <select v-model="reasonFilter" class="rounded border px-2 py-1">
        <option value="">全部规则</option>
        <option v-for="r in reasonRows" :key="r.name" :value="r.name">{{ r.name }}</option>
      </select>
      <label>改写理由 <input v-model="edit.reason" class="rounded border px-2 py-1" /></label>
    </div>
    <table class="data-table">
      <thead><tr><th>时间</th><th>flag</th><th>规则</th><th></th></tr></thead>
      <tbody>
        <tr v-if="!shownRows.length">
          <td colspan="4" class="text-slate-500">
            {{ onlyFlagged ? '当前没有 flag=1/2。取消「只看 1/2」可浏览全部点。' : '表是空的。会话可能已过期，请重新上传。' }}
          </td>
        </tr>
        <tr v-for="r in shownRows" :key="r.t" :class="r.flag===2?'bg-red-50': r.flag===1?'bg-amber-50':''">
          <td>{{ fmtTime(r.t) }}</td>
          <td>
            <select v-model.number="r.flag" class="rounded border px-1">
              <option :value="0">0</option>
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </td>
          <td>{{ r.reason }}</td>
          <td><button type="button" class="text-hydro" @click="save(r)">保存</button></td>
        </tr>
      </tbody>
    </table>
    <div class="flex gap-2 text-sm">
      <button type="button" class="rounded border px-2 py-1" :disabled="page===0" @click="page--; load()">上一页</button>
      <span>第 {{ page + 1 }} 页 / {{ table.total }} 条</span>
      <button type="button" class="rounded border px-2 py-1" @click="page++; load()">下一页</button>
    </div>
  </section>
</template>
