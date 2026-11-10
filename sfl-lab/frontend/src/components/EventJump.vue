<script setup lang="ts">
import { computed } from 'vue'
import { store } from '../state'

const windows = computed(() => (store.meta?.simTruth?.windows || []) as { id: string; label: string; from: string; to: string }[])
const active = computed(() => store.timeRange)

function jump(w: { from: string; to: string }) {
  const a = Date.parse(w.from)
  const b = Date.parse(w.to)
  if (Number.isFinite(a) && Number.isFinite(b)) store.timeRange = [a, b]
}

function all() {
  store.timeRange = null
}
</script>

<template>
  <div v-if="windows.length" class="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
    <span class="text-slate-500">跳到窗口</span>
    <button
      type="button"
      class="rounded px-2 py-1"
      :class="active ? 'border border-line' : 'bg-hydro text-white'"
      @click="all"
    >全时段</button>
    <button
      v-for="w in windows"
      :key="w.id"
      type="button"
      class="rounded px-2 py-1"
      :class="active && Math.abs(active[0] - Date.parse(w.from)) < 1000 ? 'bg-navy text-white' : 'border border-line'"
      @click="jump(w)"
    >{{ w.label }}</button>
  </div>
</template>
