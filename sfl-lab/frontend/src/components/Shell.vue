<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { refreshMeta, steps, store } from '../state'

const route = useRoute()
const router = useRouter()
const plotMeta = {
  path: '/plot',
  now: '自选叠图或散点。单位不同分左右轴。错位序列会把横轴拉宽。',
  next: '/raw',
  nextLabel: '回到曲线',
}
const step = computed(() => steps.find((s) => s.path === route.path) || (route.path === '/plot' ? plotMeta : steps[0]))
const ready = computed(() => !!store.sessionId && store.meta)
const idx = computed(() => (route.path === '/plot' ? 0 : steps.findIndex((s) => s.path === route.path) + 1))

onMounted(async () => {
  if (!store.sessionId) return
  try {
    await refreshMeta()
  } catch {
    store.sessionId = ''
    store.meta = null
    localStorage.removeItem('sfl-session')
  }
})
</script>

<template>
  <div class="min-h-dvh">
    <header class="border-b border-navy bg-navy px-5 py-3 text-white">
      <p class="text-xs text-white/70">SFL · 榆中萃英山</p>
      <h1 class="mt-0.5 text-xl text-white">微型蒸渗仪实验站</h1>
    </header>
    <nav class="sticky top-0 z-20 flex flex-wrap gap-1 border-b border-line bg-panel px-4 py-2">
      <RouterLink
        v-for="s in steps"
        :key="s.path"
        :to="s.path"
        class="rounded px-3 py-1.5 text-sm"
        :class="route.path === s.path ? 'bg-hydro text-white' : 'text-slate-700 hover:bg-slate-200'"
      >{{ s.label }}</RouterLink>
      <RouterLink
        to="/plot"
        class="rounded px-3 py-1.5 text-sm"
        :class="route.path === '/plot' ? 'bg-navy text-white' : 'text-slate-700 hover:bg-slate-200'"
      >自由作图</RouterLink>
    </nav>

    <div class="sticky top-12 z-10 mx-5 mt-4 flex flex-wrap items-center gap-3 rounded-md bg-navy px-4 py-3 text-white">
      <p class="min-w-0 flex-1 text-sm leading-6">
        <span class="mr-2 rounded bg-white/15 px-1.5 py-0.5 text-xs">{{ idx ? `${idx}/7` : '研' }}</span>
        {{ step.now }}
      </p>
      <button
        type="button"
        class="shrink-0 rounded bg-white px-3 py-1.5 text-sm text-navy"
        :disabled="step.path !== '/' && !ready"
        @click="router.push(step.next)"
      >{{ step.nextLabel }}</button>
    </div>

    <p v-if="store.meta" class="mx-5 mt-3 flex flex-wrap gap-2 text-xs tabular">
      <span class="rounded border border-line bg-white px-2 py-1">称重 {{ store.meta.coverage?.weight?.range || (store.meta.weightRows || 0) }}</span>
      <span class="rounded border px-2 py-1" :class="store.meta.probeRows ? 'border-line bg-white' : 'border-amber-300 bg-amber-50'">探头 {{ store.meta.coverage?.probe?.range || '缺' }}</span>
      <span class="rounded border px-2 py-1" :class="store.meta.coverage?.weightWeather ? 'border-line bg-white' : 'border-amber-300 bg-amber-50'">气象 {{ store.meta.weatherRows ? (store.meta.coverage?.weightWeather ? store.meta.coverage?.weather?.range : '错位 ' + (store.meta.coverage?.weather?.range || '')) : '缺' }}</span>
      <span v-if="store.meta.totals" class="rounded border border-line bg-white px-2 py-1">P {{ Number(store.meta.totals.precipMm).toFixed(1) }} / ET {{ Number(store.meta.totals.etMm).toFixed(1) }} mm</span>
    </p>
    <ul v-if="store.meta?.mechanisms?.length" class="mx-5 mt-2 space-y-1 rounded border border-navy/20 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
      <li v-for="(m, i) in store.meta.mechanisms" :key="i">{{ m }}</li>
    </ul>
    <p v-if="store.meta?.simTruth" class="mx-5 mt-2 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-slate-700">
      示例雨日 {{ (store.meta.simTruth.rainDays || []).join('、') }}。泵不是雨。
    </p>
    <p v-if="store.meta?.warning" class="mx-5 mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">{{ store.meta.warning }}</p>
    <p v-if="store.error" class="mx-5 mt-3 rounded border border-err/30 bg-red-50 px-3 py-2 text-sm text-err">{{ store.error }}</p>
    <p v-if="store.loading" class="mx-5 mt-3 text-sm text-slate-500">正在计算…</p>

    <main class="px-5 py-5">
      <RouterView :key="store.sessionId || 'none'" />
    </main>
  </div>
</template>
