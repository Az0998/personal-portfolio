<script setup lang="ts">
defineProps<{ topic?: string }>()

const papers = [
  {
    id: 'kapilaratne2017',
    topic: 'temp',
    title: 'Kapilaratne & Lu (2017) 介电探头温度订正',
    why: '只订 5TE 的 θ。',
    href: 'https://doi.org/10.1016/j.jhydrol.2017.05.050',
    local: '',
  },
  {
    id: 'peters2014',
    topic: 'filter',
    title: 'Peters et al. (2014) AWAT 滤波',
    why: '把风噪声从 P/ET 里分开。',
    href: 'https://hess.copernicus.org/articles/18/1189/2014/',
    local: '/papers/peters-2014-awat.pdf',
  },
  {
    id: 'peters2016',
    topic: 'filter',
    title: 'Peters et al. (2016) AWAT 插值改进',
    why: '台阶上加插值。',
    href: 'https://hess.copernicus.org/articles/20/2309/2016/',
    local: '/papers/peters-2016-awat.pdf',
  },
  {
    id: 'fao56',
    topic: 'et0',
    title: 'Allen et al. (1998) FAO-56',
    why: 'ET0 ≠ ETa。无同期气象不写 ET0。',
    href: 'https://www.fao.org/4/x0490e/x0490e00.htm',
    local: '',
  },
]

const shown = (topic?: string) => (topic ? papers.filter((p) => p.topic === topic) : papers)
</script>

<template>
  <aside class="rounded-lg border border-line bg-white p-4">
    <p class="text-xs tracking-wide text-hydro">文献（点标题打开 PDF / DOI）</p>
    <ul class="mt-2 space-y-2 text-sm leading-6">
      <li v-for="p in shown(topic)" :key="p.id">
        <a class="font-medium text-navy underline decoration-hydro/40" :href="p.local || p.href" target="_blank" rel="noreferrer">{{ p.title }}</a>
        <span class="ml-2 text-slate-600">{{ p.why }}</span>
      </li>
    </ul>
  </aside>
</template>
