<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setSession, store } from '../state'

const router = useRouter()
const wFile = ref<File | null>(null)
const pFile = ref<File | null>(null)
const zFile = ref<File | null>(null)

async function demo(kind: string) {
  store.loading = true
  store.error = ''
  try {
    const meta = await api(`/api/sessions/demo?kind=${encodeURIComponent(kind)}`, { method: 'POST' })
    setSession(meta.id, meta)
    await router.push('/raw')
  } catch (e: any) {
    store.error = e.message || '后端未启动。请先在 sfl-lab/backend 运行 mvnw spring-boot:run。'
  } finally {
    store.loading = false
  }
}

async function upload() {
  if (!wFile.value) {
    store.error = '请选择称重 CSV。'
    return
  }
  store.loading = true
  store.error = ''
  try {
    const fd = new FormData()
    fd.append('weight', wFile.value)
    if (pFile.value) fd.append('probe', pFile.value)
    if (zFile.value) fd.append('weather', zFile.value)
    const meta = await api('/api/sessions/files', { method: 'POST', body: fd })
    setSession(meta.id, meta)
    await router.push('/raw')
  } catch (e: any) {
    store.error = e.message
  } finally {
    store.loading = false
  }
}
</script>

<template>
  <section class="space-y-5">
    <form class="grid gap-3 rounded-lg border-2 border-hydro bg-white p-5 md:grid-cols-3" @submit.prevent="upload">
      <p class="md:col-span-3 text-sm text-slate-600">称重必传；探头、气象可缺。时段对不上则对照作废，不混用。</p>
      <label class="flex flex-col gap-1 text-sm">称重 CSV
        <input type="file" accept=".csv,.xlsx" @change="wFile = ($event.target as HTMLInputElement).files?.[0] || null" />
        <span class="text-xs text-slate-500">{{ wFile?.name || '未选' }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm">探头 CSV
        <input type="file" accept=".csv,.xlsx" @change="pFile = ($event.target as HTMLInputElement).files?.[0] || null" />
        <span class="text-xs text-slate-500">{{ pFile?.name || '未选' }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm">气象 CSV / xlsx
        <input type="file" accept=".csv,.xlsx" @change="zFile = ($event.target as HTMLInputElement).files?.[0] || null" />
        <span class="text-xs text-slate-500">{{ zFile?.name || '未选' }}</span>
      </label>
      <div class="md:col-span-3 flex flex-wrap items-center gap-3">
        <button type="submit" class="rounded bg-hydro px-5 py-2.5 text-white">上传并分析</button>
        <button type="button" class="rounded border border-navy px-4 py-2 text-navy" @click="demo('class')">
          没有实测？载入课堂示例
        </button>
      </div>
    </form>
    <dl v-if="store.meta" class="grid grid-cols-2 gap-2 text-sm tabular md:grid-cols-4">
      <div class="rounded border border-line bg-white p-2"><dt class="text-slate-500">称重</dt><dd>{{ store.meta.weightRows }}</dd></div>
      <div class="rounded border border-line bg-white p-2"><dt class="text-slate-500">探头</dt><dd>{{ store.meta.probeRows }}</dd></div>
      <div class="rounded border border-line bg-white p-2"><dt class="text-slate-500">气象</dt><dd>{{ store.meta.weatherRows }}</dd></div>
      <div class="rounded border border-line bg-white p-2"><dt class="text-slate-500">5 g 门限</dt><dd>{{ Number(store.meta.gateMm).toFixed(3) }} mm</dd></div>
    </dl>
    <p v-if="store.meta?.simTruth" class="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm leading-6 text-slate-700">
      示例雨日 {{ (store.meta.simTruth.rainDays || []).join('、') }}。泵不是雨。
    </p>
  </section>
</template>
