<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, store } from '../state'
import PapersStrip from '../components/PapersStrip.vue'
import DrillCard from '../components/DrillCard.vue'

const rep = ref<any>(null)
const copied = ref(false)

async function load() {
  if (!store.sessionId) return
  try {
    rep.value = await api(`/api/sessions/${store.sessionId}/report`)
  } catch (e: any) {
    store.error = e.message
  }
}
onMounted(load)
watch(() => store.sessionId, load)

function reportText() {
  if (!rep.value) return ''
  const lines = [rep.value.paragraph, '']
  if (rep.value.notes?.length) lines.push(...rep.value.notes, '')
  if (rep.value.drill) {
    lines.push(`当堂判断 ${rep.value.drill.ok}/${rep.value.drill.n}`)
    for (const it of rep.value.drill.items || []) {
      lines.push(`- ${it.prompt} → ${it.ok ? '对' : '不对'}。${it.explain}`)
    }
    lines.push('')
  }
  if (rep.value.guess?.rows) {
    lines.push('水平衡先估再揭')
    for (const r of rep.value.guess.rows) {
      lines.push(`- ${r.key} 估 ${r.guess} / 算 ${r.calc} ${r.close ? '接近' : '偏了'}`)
    }
    lines.push('')
  }
  lines.push('口径：5 g ≈ 0.071 mm。泵不是雨。ET0 ≠ ETa。Kapilaratne 只订 5TE 的 θ。')
  return lines.join('\n') + '\n'
}

async function copyText() {
  const text = reportText()
  if (!text) return
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function download() {
  if (!rep.value) return
  const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'sfl-lab-report.txt'
  a.click()
}
</script>

<template>
  <section class="space-y-4">
    <p class="rounded-lg border border-line bg-white p-5 leading-7">
      {{ rep?.paragraph || '载入数据后出现报告段。' }}
    </p>
    <ul v-if="rep?.notes?.length" class="rounded-lg border border-line bg-white px-5 py-3 text-sm leading-7">
      <li v-for="(n, i) in rep.notes" :key="i">{{ n }}</li>
    </ul>
    <dl v-if="rep?.totals" class="grid grid-cols-2 gap-2 text-sm tabular md:grid-cols-4">
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">错误率</dt><dd class="text-lg">{{ Number(rep.errorRate).toFixed(2) }}%</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">可疑率</dt><dd class="text-lg">{{ Number(rep.suspectRate).toFixed(2) }}%</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">闭合差</dt><dd class="text-lg">{{ Number(rep.totals.closureMm).toFixed(2) }} mm</dd></div>
      <div class="rounded-lg border border-line bg-white p-3"><dt class="text-slate-500">P / ET</dt><dd class="text-lg">{{ Number(rep.totals.precipMm).toFixed(1) }} / {{ Number(rep.totals.etMm).toFixed(1) }}</dd></div>
    </dl>
    <p v-if="rep?.drill" class="rounded border border-line bg-white px-4 py-3 text-sm">
      当堂判断 {{ rep.drill.ok }}/{{ rep.drill.n }}。
    </p>
    <p v-if="rep?.guess" class="rounded border border-line bg-white px-4 py-3 text-sm">
      水平衡已对照。差得远就回旗标，不要硬改数字。
    </p>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="rounded bg-hydro px-4 py-2 text-white" @click="copyText">{{ copied ? '已复制' : '复制全文' }}</button>
      <button type="button" class="rounded border border-navy px-4 py-2 text-navy" @click="download">导出报告</button>
    </div>
    <DrillCard />
    <PapersStrip />
  </section>
</template>
