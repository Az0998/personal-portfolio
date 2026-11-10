<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, store } from '../state'

const pack = ref<any>(null)
const picks = ref<Record<string, string>>({})
const result = ref<any>(null)
const sending = ref(false)

async function load() {
  if (!store.sessionId) return
  try {
    pack.value = await api(`/api/sessions/${store.sessionId}/drill`)
    result.value = pack.value?.result || null
  } catch (e: any) {
    store.error = e.message
  }
}

async function submit() {
  if (!store.sessionId) return
  sending.value = true
  try {
    result.value = await api(`/api/sessions/${store.sessionId}/drill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: picks.value }),
    })
  } catch (e: any) {
    store.error = e.message
  } finally {
    sending.value = false
  }
}

onMounted(load)
watch(() => store.sessionId, load)
</script>

<template>
  <section v-if="pack?.questions?.length" class="rounded-lg border-2 border-hydro bg-white p-5">
    <p class="text-xs font-semibold tracking-wide text-hydro">当堂判断 · 提交后才给解释</p>
    <h2 class="mt-1 text-lg">三道题，对完曲线再选</h2>
    <ol class="mt-3 space-y-4">
      <li v-for="(q, i) in pack.questions" :key="q.id">
        <p class="text-sm font-medium">{{ i + 1 }}. {{ q.prompt }}</p>
        <div class="mt-2 flex flex-col gap-1">
          <label v-for="o in q.options" :key="o.id" class="flex items-center gap-2 text-sm">
            <input v-model="picks[q.id]" type="radio" :value="o.id" :disabled="!!result" />
            {{ o.label }}
          </label>
        </div>
      </li>
    </ol>
    <button
      v-if="!result"
      type="button"
      class="mt-4 rounded bg-hydro px-4 py-2 text-white disabled:opacity-50"
      :disabled="sending || pack.questions.some((q: any) => !picks[q.id])"
      @click="submit"
    >提交判断</button>
    <p v-if="result" class="mt-4 text-sm">
      {{ result.ok }} / {{ result.n }} 对。
    </p>
    <ul v-if="result?.items" class="mt-2 space-y-2 text-sm leading-6">
      <li v-for="it in result.items" :key="it.id" :class="it.ok ? 'text-slate-700' : 'text-amber-950'">
        {{ it.ok ? '对。' : '不对。' }} {{ it.explain }}
      </li>
    </ul>
  </section>
</template>
