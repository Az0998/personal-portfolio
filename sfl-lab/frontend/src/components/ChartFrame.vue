<script setup lang="ts">
defineProps<{ title: string; kind: string; read: string; empty?: boolean }>()
</script>

<template>
  <figure class="overflow-hidden rounded-lg border border-line bg-white">
    <figcaption class="border-b border-line bg-panel px-4 py-3">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-base text-navy">{{ title }}</h3>
        <span class="rounded bg-hydro/10 px-2 py-0.5 text-xs text-hydro">{{ kind }}</span>
      </div>
      <p class="mt-2 text-sm leading-6 text-pretty text-slate-600">{{ read }}</p>
    </figcaption>
    <slot v-if="!empty" />
    <p v-else class="px-4 py-10 text-center text-sm text-slate-500">这一项没有有效曲线，已跳过。</p>
  </figure>
</template>
