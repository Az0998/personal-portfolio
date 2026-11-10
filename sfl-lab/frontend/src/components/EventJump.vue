<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { store } from '../state'

type Win = { id: string; when: string; look: string; label: string; from: string; to: string }

const windows = computed(() => (store.meta?.simTruth?.windows || []) as Win[])
const activeId = computed(() => {
  const range = store.timeRange
  if (!range) return ''
  const hit = windows.value.find((w) => Math.abs(Date.parse(w.from) - range[0]) < 1000)
  return hit?.id || ''
})
const active = computed(() => windows.value.find((w) => w.id === activeId.value) || null)

function jump(w: Win) {
  const a = Date.parse(w.from)
  const b = Date.parse(w.to)
  if (Number.isFinite(a) && Number.isFinite(b)) store.timeRange = [a, b]
}

function all() {
  store.timeRange = null
}

function step(dir: number) {
  const list = windows.value
  if (!list.length) return
  const i = list.findIndex((w) => w.id === activeId.value)
  const next = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length
  jump(list[next])
}

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  const key = e.key.toUpperCase()
  const hit = windows.value.find((w) => w.id === key)
  if (hit) {
    e.preventDefault()
    jump(hit)
    return
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    step(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step(-1)
  } else if (e.key === '0' || e.key === 'Escape') {
    all()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section v-if="windows.length" class="jump-rail" aria-label="课堂窗口">
    <div class="jump-rail-head">
      <p>功能 1 · 跳到窗口</p>
      <strong>{{ active ? `正在看 ${active.label}` : '正在看全时段' }}</strong>
    </div>
    <div class="jump-rail-row" role="toolbar">
      <button type="button" :aria-pressed="!activeId" :class="{ on: !activeId }" @click="all">全时段</button>
      <button
        v-for="w in windows"
        :key="w.id"
        type="button"
        :aria-pressed="activeId === w.id"
        :class="{ on: activeId === w.id }"
        @click="jump(w)"
      >
        <b>{{ w.id }}</b>
        <span>{{ w.when }}</span>
      </button>
      <button type="button" @click="step(-1)">上一窗</button>
      <button type="button" @click="step(1)">下一窗</button>
    </div>
    <p v-if="active" class="jump-look">{{ active.look }}</p>
    <p v-else class="jump-look">按 A–E 或方向键切换。五个窗口用的是同一套横轴，质量、泵柱和三层 θ 一起动。</p>
  </section>
</template>
