import { reactive } from 'vue'

export const steps = [
  {
    path: '/',
    label: '1 接入',
    now: '上传称重，探头和气象可缺。时段对不上就不要硬对照。',
    next: '/raw',
    nextLabel: '下一步：看曲线',
  },
  {
    path: '/raw',
    label: '2 曲线',
    now: '距平和三层 θ。可跳窗口 A–E。看完做三道判断。',
    next: '/flags',
    nextLabel: '下一步：旗标',
  },
  {
    path: '/flags',
    label: '3 旗标',
    now: '无雨 θ 台阶、日周期、深层先动标可疑。改完再订正。',
    next: '/process',
    nextLabel: '下一步：订正滤波',
  },
  {
    path: '/process',
    label: '4 订正',
    now: '只订 5TE 的 θ。滤波看残差，不看重合的全序列。',
    next: '/balance',
    nextLabel: '下一步：水平衡',
  },
  {
    path: '/balance',
    label: '5 水平衡',
    now: '先估 P、ET、ΔS、D，再对照。泵和风振不要算进 P。',
    next: '/results',
    nextLabel: '下一步：物理验证',
  },
  {
    path: '/results',
    label: '6 验证',
    now: '浅层是否先湿，θ 是否跟着土温假抖。对不上回旗标。',
    next: '/report',
    nextLabel: '下一步：报告',
  },
  {
    path: '/report',
    label: '7 报告',
    now: '一段可粘贴文字，含判断和估计对照。ET0 不是 ETa。',
    next: '/',
    nextLabel: '回到接入',
  },
]

export const store = reactive({
  sessionId: localStorage.getItem('sfl-session') || '',
  meta: null as any,
  error: '',
  loading: false,
  timeRange: null as [number, number] | null,
})

export function setSession(id: string, meta?: any) {
  store.sessionId = id
  store.timeRange = null
  localStorage.setItem('sfl-session', id)
  if (meta) store.meta = meta
}

export async function api(path: string, init?: RequestInit) {
  store.error = ''
  const res = await fetch(path, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || res.statusText
    if (res.status === 404) {
      throw new Error("接口不存在。请用 sfl-lab/backend 的 mvnw spring-boot:run 跑当前源码，不要 java -jar 旧包。")
    }
    throw new Error(msg)
  }
  return data
}

export async function refreshMeta() {
  if (!store.sessionId) return
  store.meta = await api(`/api/sessions/${store.sessionId}`)
}

export function fmtTime(ms: number) {
  if (!ms) return '—'
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export const COLORS = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#000000']
