<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AcademicChart from '../components/AcademicChart.vue'
import ChartFrame from '../components/ChartFrame.vue'
import { api, store } from '../state'
import { toPairs, type SeriesSpec } from '../lib/series'

type Channel = {
  id: string
  group: 'weight' | 'probe' | 'weather' | 'filter'
  key: string
  label: string
  unit: string
}

const CHANNELS: Channel[] = [
  { id: 'lywAnomMm', group: 'weight', key: 'lywAnomMm', label: '蒸渗桶距平', unit: 'mm' },
  { id: 'swwAnomMm', group: 'weight', key: 'swwAnomMm', label: '补水桶距平', unit: 'mm' },
  { id: 'lyw', group: 'weight', key: 'lyw', label: '蒸渗桶质量', unit: 'kg' },
  { id: 'sww', group: 'weight', key: 'sww', label: '补水桶质量', unit: 'kg' },
  { id: 'pumpIn', group: 'weight', key: 'pumpIn', label: '泵入', unit: 's' },
  { id: 'pumpOut', group: 'weight', key: 'pumpOut', label: '泵出', unit: 's' },
  { id: 'echo1', group: 'probe', key: 'echo1', label: '15 cm θ', unit: '%' },
  { id: 'echo2', group: 'probe', key: 'echo2', label: '35 cm θ', unit: '%' },
  { id: 'echo3', group: 'probe', key: 'echo3', label: '55 cm θ', unit: '%' },
  { id: 'echo1c', group: 'probe', key: 'echo1c', label: '15 cm θ 订正', unit: '%' },
  { id: 'echo2c', group: 'probe', key: 'echo2c', label: '35 cm θ 订正', unit: '%' },
  { id: 'echo3c', group: 'probe', key: 'echo3c', label: '55 cm θ 订正', unit: '%' },
  { id: 'temp1', group: 'probe', key: 'temp1', label: '15 cm 土温', unit: '°C' },
  { id: 'temp2', group: 'probe', key: 'temp2', label: '35 cm 土温', unit: '°C' },
  { id: 'temp3', group: 'probe', key: 'temp3', label: '55 cm 土温', unit: '°C' },
  { id: 'ec1', group: 'probe', key: 'ec1', label: '15 cm EC', unit: 'dS/m' },
  { id: 'ec2', group: 'probe', key: 'ec2', label: '35 cm EC', unit: 'dS/m' },
  { id: 'ec3', group: 'probe', key: 'ec3', label: '55 cm EC', unit: 'dS/m' },
  { id: 'mps1', group: 'probe', key: 'mps1', label: '15 cm MPS', unit: 'kPa' },
  { id: 'mps2', group: 'probe', key: 'mps2', label: '35 cm MPS', unit: 'kPa' },
  { id: 'mps3', group: 'probe', key: 'mps3', label: '55 cm MPS', unit: 'kPa' },
  { id: 'vtens', group: 'probe', key: 'vtens', label: '张力计', unit: 'kPa' },
  { id: 'precip', group: 'weather', key: 'precip', label: '降水', unit: 'mm' },
  { id: 'airT', group: 'weather', key: 'airT', label: '气温', unit: '°C' },
  { id: 'rh', group: 'weather', key: 'rh', label: '相对湿度', unit: '%' },
  { id: 'rs', group: 'weather', key: 'rs', label: '辐射', unit: 'W/m²' },
  { id: 'wind', group: 'weather', key: 'wind', label: '风速', unit: 'm/s' },
  { id: 'rawMm', group: 'filter', key: 'rawMm', label: '滤波前距平', unit: 'mm' },
  { id: 'filteredMm', group: 'filter', key: 'filteredMm', label: '滤波后距平', unit: 'mm' },
]

const PRESETS = [
  { name: '距平与雨', ids: ['lywAnomMm', 'precip'] },
  { name: '三层θ与雨', ids: ['echo1', 'echo2', 'echo3', 'precip'] },
  { name: 'θ与土温', ids: ['echo1', 'temp1'] },
  { name: '订正前后', ids: ['echo1', 'echo1c'] },
]

const packs = reactive<Record<string, any>>({ weight: null, probe: null, weather: null, filter: null })
const picked = ref<string[]>(['lywAnomMm', 'echo1', 'precip'])
const mode = ref<'time' | 'scatter'>('time')

async function load() {
  if (!store.sessionId) return
  store.loading = true
  try {
    const [w, p, z, f] = await Promise.all([
      api(`/api/sessions/${store.sessionId}/series?group=weight&maxPoints=2400`),
      api(`/api/sessions/${store.sessionId}/series?group=probe&maxPoints=2000`),
      api(`/api/sessions/${store.sessionId}/series?group=weather&maxPoints=2000`),
      api(`/api/sessions/${store.sessionId}/series?group=filter&maxPoints=2000`),
    ])
    packs.weight = w
    packs.probe = p
    packs.weather = z
    packs.filter = f
  } catch (e: any) {
    store.error = e.message
  } finally {
    store.loading = false
  }
}
onMounted(load)
watch(() => store.sessionId, load)
watch(picked, (ids) => {
  if (ids.length !== 2 && mode.value === 'scatter') mode.value = 'time'
})

function ch(id: string) {
  return CHANNELS.find((c) => c.id === id)
}
function pairs(id: string): [number, number][] {
  const c = ch(id)
  if (!c) return []
  const pack = packs[c.group]
  return toPairs(pack?.t, pack?.series?.[c.key])
}
function toggle(id: string) {
  const i = picked.value.indexOf(id)
  if (i >= 0) picked.value = picked.value.filter((x) => x !== id)
  else if (picked.value.length < 6) picked.value = [...picked.value, id]
}

const selected = computed(() => picked.value.map(ch).filter(Boolean) as Channel[])
const units = computed(() => [...new Set(selected.value.map((c) => c.unit))])
const leftUnit = computed(() => units.value[0] || '')
const rightUnit = computed(() => units.value.filter((u) => u !== leftUnit.value).join(' / '))
const unitWarn = computed(() =>
  units.value.length > 2 ? '超过两种单位时右轴会混刻度。建议每次只选两种单位，或改用散点看相关。' : '',
)

function applyPreset(ids: string[]) {
  picked.value = ids
  mode.value = ids.length === 2 ? mode.value : 'time'
}
function swapAxes() {
  if (picked.value.length === 2) picked.value = [picked.value[1], picked.value[0]]
}

const overlay = computed<SeriesSpec[]>(() =>
  selected.value.map((c) => ({
    name: `${c.label} (${c.unit})`,
    data: pairs(c.id),
    yAxisIndex: c.unit === leftUnit.value ? 0 : 1,
    type: c.id === 'precip' ? 'bar' : 'line',
    thick: c.unit === leftUnit.value,
  })),
)

function nearestJoin(a: [number, number][], b: [number, number][]): [number, number][] {
  if (!a.length || !b.length) return []
  let j = 0
  const out: [number, number][] = []
  const windowMs = 20 * 60 * 1000
  for (const [t, y] of a) {
    while (j + 1 < b.length && Math.abs(b[j + 1][0] - t) <= Math.abs(b[j][0] - t)) j++
    if (Math.abs(b[j][0] - t) <= windowMs) out.push([y, b[j][1]])
  }
  return out
}

const scatter = computed<SeriesSpec[]>(() => {
  if (selected.value.length !== 2) return []
  const [a, b] = selected.value
  return [
    {
      name: `${a.label} vs ${b.label}`,
      type: 'scatter',
      data: nearestJoin(pairs(a.id), pairs(b.id)),
    },
  ]
})

const selectedGroups = computed(() => [...new Set(selected.value.map((c) => c.group))])
const mismatch = computed(() => {
  const c = store.meta?.coverage
  if (!c) return false
  const g = selectedGroups.value
  if (g.includes('weight') && g.includes('probe') && c.weightProbe === false) return true
  if (g.includes('weight') && g.includes('weather') && c.weightWeather === false) return true
  if (g.includes('probe') && g.includes('weather') && c.probeWeather === false) return true
  return false
})
function groupLive(g: string) {
  if (g === 'weight' || g === 'filter') return (store.meta?.weightRows || 0) > 0
  if (g === 'probe') return (store.meta?.probeRows || 0) > 0
  if (g === 'weather') return (store.meta?.weatherRows || 0) > 0
  return true
}

const groups = [
  { key: 'weight', title: '称重' },
  { key: 'probe', title: '探头' },
  { key: 'weather', title: '气象' },
  { key: 'filter', title: '滤波' },
] as const
</script>

<template>
  <section class="space-y-5">
    <p v-if="!store.sessionId" class="rounded border border-line bg-white px-4 py-3 text-sm">
      还没有数据。回到「1 接入」上传 CSV 或载入课堂示例，再来自选要素。
    </p>
    <div v-else class="rounded-lg border border-line bg-white p-4 space-y-3">
      <p class="text-sm text-slate-600">最多 6 条。单位不同分左右轴。恰好两条可散点。</p>
      <p v-if="store.meta?.coverage && selectedGroups.length > 1 && mismatch" class="text-xs text-amber-800">
        所选序列时段无交集，横轴会被拉宽，对照无意义。
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in PRESETS"
          :key="p.name"
          type="button"
          class="rounded border border-line px-2 py-1 text-xs text-navy hover:bg-slate-100"
          @click="applyPreset(p.ids)"
        >{{ p.name }}</button>
        <button type="button" class="rounded border border-line px-2 py-1 text-xs text-slate-500" @click="picked = []">清空</button>
      </div>
      <p v-if="unitWarn" class="text-xs text-amber-800">{{ unitWarn }}</p>
      <div v-for="g in groups" :key="g.key" class="space-y-1" :class="groupLive(g.key) ? '' : 'opacity-40'">
        <p class="text-xs font-semibold text-navy">{{ g.title }}{{ groupLive(g.key) ? '' : '（缺）' }}</p>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="c in CHANNELS.filter((x) => x.group === g.key)"
            :key="c.id"
            class="flex items-center gap-1 rounded border px-2 py-1 text-xs"
            :class="picked.includes(c.id) ? 'border-hydro bg-sky-50' : 'border-line'"
          >
            <input type="checkbox" :disabled="!groupLive(c.group)" :checked="picked.includes(c.id)" @change="toggle(c.id)" />
            {{ c.label }}
            <span class="text-slate-400">{{ c.unit }}</span>
          </label>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          class="rounded px-3 py-1.5"
          :class="mode === 'time' ? 'bg-hydro text-white' : 'border border-navy text-navy'"
          @click="mode = 'time'"
        >时间序列</button>
        <button
          type="button"
          class="rounded px-3 py-1.5"
          :disabled="selected.length !== 2"
          :class="mode === 'scatter' ? 'bg-hydro text-white' : 'border border-navy text-navy disabled:opacity-40'"
          @click="mode = 'scatter'"
        >散点（需恰好 2 条）</button>
        <button
          v-if="mode === 'scatter' && selected.length === 2"
          type="button"
          class="rounded border border-navy px-3 py-1.5 text-navy"
          @click="swapAxes"
        >交换横纵轴</button>
      </div>
    </div>

    <ChartFrame
      v-if="store.sessionId && mode === 'time'"
      title="自选要素"
      kind="自由作图 · 时间序列"
      :read="`左轴 ${leftUnit || '—'}；右轴 ${rightUnit || '无'}。降水用柱，其余用线。`"
    >
      <AcademicChart
        v-if="overlay.length"
        title=""
        :y-name="leftUnit"
        :y2-name="rightUnit || undefined"
        compact
        height="420px"
        :series="overlay"
        :annotate="false"
      />
    </ChartFrame>

    <ChartFrame
      v-if="store.sessionId && mode === 'scatter' && selected.length === 2"
      title="散点"
      kind="自由作图 · 相关"
      :read="`横轴 ${selected[0].label}（${selected[0].unit}），纵轴 ${selected[1].label}（${selected[1].unit}）。点按时间最近邻对齐，窗口 20 min。`"
    >
      <AcademicChart
        title=""
        x-type="value"
        :x-name="`${selected[0].label} (${selected[0].unit})`"
        :y-name="`${selected[1].label} (${selected[1].unit})`"
        compact
        height="420px"
        :series="scatter"
        :identity-line="selected[0].unit === selected[1].unit"
        :annotate="false"
      />
    </ChartFrame>
  </section>
</template>
