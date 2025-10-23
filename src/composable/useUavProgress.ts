// src/composables/useUavProgress.ts
import { ref, computed } from 'vue'
import { getLatestMission, type UavMission } from '@/api/uav'

const POLL_MS   = Number(import.meta.env.VITE_UAV_POLL_MS   ?? 3000)  // 轮询间隔
const STALE_MS  = Number(import.meta.env.VITE_UAV_STALE_MS  ?? 10000) // “新鲜”阈值
const STALL_MS  = Number(import.meta.env.VITE_UAV_STALL_MS  ?? 30000) // “停滞”阈值
const DONE_HOLD = Number(import.meta.env.VITE_UAV_DONE_HOLD ?? 10000) // 完成后保留

export function useUavProgress() {
  const mission = ref<UavMission | null>(null)
  const lastFetchAt = ref<number>(0)           // 本地收到时间
  const visible = ref(false)
  const _timer = ref<number | null>(null)
  const _hideTimer = ref<number | null>(null)

  const total = computed(() => mission.value?.bytes.total ?? 0)
  const sent  = computed(() => mission.value?.bytes.sent  ?? 0)
  const progress = computed(() => total.value > 0 ? Math.min(100, Math.round(sent.value / total.value * 100)) : 0)

  const state = computed(() => mission.value?.state ?? 'unknown')
  const updatedAt = computed(() => {
    const s = mission.value?.updated_at
    const t = s ? Date.parse(s) : 0
    return Number.isFinite(t) ? t : 0
  })

  const fresh   = computed(() => Date.now() - (updatedAt.value || lastFetchAt.value) <= STALE_MS)
  const stalled = computed(() => Date.now() - (updatedAt.value || lastFetchAt.value) > STALL_MS)
  const done    = computed(() => {
    const st = state.value
    return (st === 'confirmed' || st === 'cleaned') || (total.value > 0 && sent.value >= total.value)
  })
  const failed  = computed(() => state.value === 'failed')

  function decideVisibility() {
    // 进行中条件：queued/sending 或 sent<total，并且“新鲜”
    const st = state.value
    const inProgress = (st === 'queued' || st === 'sending' || (total.value > 0 && sent.value < total.value))
    if ((failed.value || stalled.value) && mission.value) {
      visible.value = true
      return
    }
    if (inProgress && fresh.value) {
      visible.value = true
      return
    }
    // 完成后延迟收起
    if (done.value && visible.value) {
      if (_hideTimer.value) clearTimeout(_hideTimer.value)
      // @ts-ignore
      _hideTimer.value = setTimeout(() => (visible.value = false), DONE_HOLD) as unknown as number
      return
    }
    if (!inProgress) visible.value = false
  }

  async function pullOnce() {
    try {
      const res = await getLatestMission()
      mission.value = res.data as unknown as UavMission
      lastFetchAt.value = Date.now()
    } catch {
      // 失败时不改 mission，只靠超时判断 stalled/隐藏
    } finally {
      decideVisibility()
    }
  }

  function start() {
    if (_timer.value) return
    pullOnce()
    // @ts-ignore
    _timer.value = setInterval(pullOnce, POLL_MS) as unknown as number
  }

  function stop() {
    if (_timer.value) { clearInterval(_timer.value); _timer.value = null }
    if (_hideTimer.value) { clearTimeout(_hideTimer.value); _hideTimer.value = null }
  }

  function show() { visible.value = true }
  function hide() { visible.value = false }

  return {
    // 状态
    mission, state, progress, total, sent,
    fresh, stalled, done, failed, updatedAt,
    visible,
    // 控制
    start, stop, show, hide, refresh: pullOnce,
  }
}
