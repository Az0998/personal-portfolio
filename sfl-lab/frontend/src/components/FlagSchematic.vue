<script setup lang="ts">
defineProps<{ error?: number; suspect?: number; okHint?: string }>()
</script>

<template>
  <figure class="rounded-md border border-line bg-white p-4 text-sm">
    <figcaption class="mb-3 font-medium">误差从哪来（改旗标前先对号）</figcaption>
    <div class="grid gap-3 md:grid-cols-3">
      <div class="rounded border border-emerald-200 bg-emerald-50 p-3">
        <p class="font-medium text-emerald-900">0 正确</p>
        <p class="mt-1 text-stone-700">过门限增重才记雨；夜间缓慢减重才是 ET。</p>
      </div>
      <div class="rounded border border-amber-200 bg-amber-50 p-3">
        <p class="font-medium text-amber-900">1 可疑 · {{ suspect ?? '—' }}</p>
        <p class="mt-1 text-stone-700">风振、碰壁、泵脉冲、储水瓶台阶：看起来像跳变，不是降水。</p>
      </div>
      <div class="rounded border border-red-200 bg-red-50 p-3">
        <p class="font-medium text-red-900">2 错误 · {{ error ?? '—' }}</p>
        <p class="mt-1 text-stone-700">缺测、尖峰、MPS −9990、物理不可能值。表里可改。</p>
      </div>
    </div>
    <p v-if="okHint" class="mt-3 text-stone-600">{{ okHint }}</p>
  </figure>
</template>
