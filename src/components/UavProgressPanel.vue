<!-- src/components/UavProgressPanel.vue -->
<template>
  <!-- 根节点：这里加 class 和绑定 -->
  <div class="panel" :class="{ show: visible }">
    <!-- 头部 -->
    <div class="header">
      <div>
        <div class="title">无人机任务进度</div>
        <div class="sub">
          {{ mission?.mission_id || '—' }}
          <span v-if="updatedAt"> · 更新 {{ timeAgo }}</span>
        </div>
      </div>
      <div class="badges">
        <span v-if="failed" class="badge err">失败</span>
        <span v-else-if="stalled" class="badge warn">传输停滞</span>
        <span v-else-if="done" class="badge ok">已完成</span>
        <span v-else class="badge run">进行中</span>
        <button class="close" @click="$emit('close')">✕</button>
      </div>
    </div>

    <!-- 总进度 -->
    <div class="section">
      <div class="row">
        <span>总进度</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="bar"><i :style="{ width: progress + '%' }"></i></div>
       </div>

    <!-- 文件列表 -->
    <div class="files">
      <div v-for="f in (mission?.files || []).slice(0, 8)" :key="f.name" class="file">
        <div class="row">
          <div style="max-width: 230px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="f.name">
            {{ f.name }}
          </div>
          <div>{{ Math.min(100, Math.round((f.sent||0)/Math.max(1,f.size)*100)) }}%</div>
        </div>
        <div class="fbar">
          <i :style="{ width: Math.min(100, Math.round((f.sent||0)/Math.max(1,f.size)*100)) + '%' }"></i>
        </div>
        <div class="small">
          {{ formatBytes(f.sent||0) }} / {{ formatBytes(f.size||0) }}
          <span :class="badgeClass(f.status)">{{ f.status }}</span>
        </div>
      </div>

      <div v-if="(mission?.files || []).length === 0" class="small">暂无文件。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { UavMission } from '@/api/uav'

type BoolLike = boolean | Ref<boolean> | ComputedRef<boolean>
type NumLike  = number  | Ref<number>  | ComputedRef<number>
type MissionLike = UavMission | null | Ref<UavMission | null> | ComputedRef<UavMission | null>

const props = defineProps<{
  visible: BoolLike
  mission: MissionLike
  progress: NumLike
  total: NumLike
  sent: NumLike
  stalled: BoolLike
  failed: BoolLike
  done: BoolLike
  updatedAt: NumLike
}>()

const visible   = computed(() => unref(props.visible))
const mission   = computed(() => unref(props.mission))
const progress  = computed(() => unref(props.progress))
const total     = computed(() => unref(props.total))
const sent      = computed(() => unref(props.sent))
const stalled   = computed(() => unref(props.stalled))
const failed    = computed(() => unref(props.failed))
const done      = computed(() => unref(props.done))
const updatedAt = computed(() => unref(props.updatedAt))

defineEmits<{ (e: 'close'): void }>()

const timeAgo = computed(() => {
  const t = updatedAt.value
  if (!t) return ''
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (sec < 60) return `${sec}s 前`
  const m = Math.floor(sec / 60)
  return `${m}m 前`
})

function formatBytes(n: number) {
  if (!n) return '0 B'
  const u = ['B','KB','MB','GB','TB']
  let i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(1)} ${u[i]}`
}

function badgeClass(st: string) {
  if (st === 'verified') return 'tag tag-ok'
  if (st === 'transferring') return 'tag tag-run'
  if (st === 'queued') return 'tag tag-gray'
  if (st === 'mismatch' || st === 'failed') return 'tag tag-bad'
  return 'tag'
}
</script>

<style scoped>
/* 抽屉容器（右侧滑出） */
.panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 360px;
  background: #0b1220;
  color: #fff;
  box-shadow: -6px 0 18px rgba(0,0,0,.35);
  transform: translateX(100%);
  transition: transform .3s ease;
  z-index: 5000; /* 高于大屏图表 */
}
.panel.show { transform: translateX(0); }

/* 头部 */
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.1); }
.title { font-weight: 600; font-size: 14px; }
.sub { opacity: .7; font-size: 12px; margin-top: 2px; }
.badges { display: flex; align-items: center; gap: 8px; }
.close { background: transparent; color: #fff; border: 0; cursor: pointer; opacity: .7 }
.close:hover { opacity: 1; }

/* 状态小标签 */
.badge { font-size: 12px; padding: 2px 6px; border-radius: 4px; }
.badge.ok { background: rgba(16,185,129,.8); }
.badge.run { background: rgba(2,132,199,.8); }
.badge.warn { background: rgba(202,138,4,.8); }
.badge.err { background: rgba(220,38,38,.85); }

/* 总进度 */
.section { padding: 12px 16px; }
.row { display: flex; justify-content: space-between; font-size: 12px; opacity: .8; margin-bottom: 6px; }
.bar { height: 8px; width: 100%; background: rgba(255,255,255,.1); border-radius: 6px; overflow: hidden; }
.bar > i { display: block; height: 100%; background: #1da1f2; width: 0; transition: width .25s; }
.small { font-size: 11px; opacity: .6; margin-top: 4px; }

/* 文件列表 */
.files { padding: 0 16px 16px; overflow: auto; max-height: calc(100% - 130px); }
.file { margin-bottom: 12px; }
.file .row { margin-bottom: 4px; }
.fbar { height: 6px; background: rgba(255,255,255,.1); border-radius: 4px; overflow: hidden; }
.fbar > i { display: block; height: 100%; background: #10b981; transition: width .25s; }

/* 文件状态 tag */
.tag { font-size: 10px; padding: 2px 4px; border-radius: 3px; background: rgba(255,255,255,.15); margin-left: 8px; }
.tag-ok { background: rgba(16,185,129,.7); }
.tag-run { background: rgba(2,132,199,.7); }
.tag-gray { background: rgba(107,114,128,.6); }
.tag-bad { background: rgba(220,38,38,.8); }
</style>
