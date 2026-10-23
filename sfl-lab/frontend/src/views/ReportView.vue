<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, store } from '../state'
import PapersStrip from '../components/PapersStrip.vue'

const rep = ref<any>(null)

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

function download() {
  if (!rep.value) return
  const blob = new Blob([rep.value.paragraph + '\n'], { type: 'text/plain;charset=utf-8' })
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
    <button type="button" class="rounded bg-hydro px-4 py-2 text-white" @click="download">导出报告</button>
    <PapersStrip />
  </section>
</template>
