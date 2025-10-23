<!-- src/views/VideoList.vue -->
<template>
  <div class="video-list-wrapper">
    <div class="card-title">
      <span class="tit">视频列表</span>
      <span class="sub-tit">Panda Records</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="" />
    </div>

    <!-- 查询条 -->
    <div class="query-bar">
      <input
        v-model.trim="queryRodId"
        type="text"
        placeholder="按设备ID过滤（可选）"
      />
      <button class="btn" @click="onSearch">查询</button>
      <button class="btn ghost" @click="onReset">重置</button>
    </div>

    <!-- 表格 -->
    <div class="table">
      <div class="thead">
        <div class="th col-id">设备ID</div>
        <div class="th col-lng">经度</div>
        <div class="th col-lat">纬度</div>
        <div class="th col-name">视频名称</div>
        <div class="th col-time">拍摄时间</div>
      </div>

      <div class="tbody">
        <div v-for="row in rows" :key="row.id" class="tr">
          <div class="td col-id">{{ row.rod_id }}</div>
          <div class="td col-lng">{{ fmtCoord(row.longitude) }}</div>
          <div class="td col-lat">{{ fmtCoord(row.latitude) }}</div>

          <div class="td col-name">
            <a href="javascript:;" class="link" @click="openPlayer(row)">
              {{ row.video_filename }}
            </a>
          </div>

          <div class="td col-time">
            {{ row.shot_time || '-' }}
          </div>
        </div>

        <div v-if="rows.length === 0" class="empty">暂无数据</div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <button class="pg" :disabled="page === 1" @click="goto(page - 1)">上一页</button>
        <span class="pg-info">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
        <button class="pg" :disabled="page * pageSize >= total" @click="goto(page + 1)">下一页</button>
      </div>
    </div>

    <!-- 播放器弹层（简化版） -->
    <div class="dialog-mask" v-if="showPlayer" @click.self="closePlayer">
      <div class="dialog">
        <div class="dialog-hd">
          <div class="title">{{ current?.video_filename }}</div>
          <button class="close" @click="closePlayer">×</button>
        </div>
        <div class="dialog-bd">
          <video
            v-if="current"
            :key="currentSrc"
            :src="currentSrc"
            ref="videoRef"
            controls
            muted
            playsinline
            preload="metadata"
            style="width: 100%; height: 100%; background:#000;"
            @loadedmetadata="onVideoLoaded"
            @error="onVideoError"
          >
            您的浏览器不支持 HTML5 视频。
          </video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import { apiListVideos } from '@/api/videos'

type VideoRow = {
  id: number
  rod_id: number
  longitude: number | null
  latitude: number | null
  video_filename: string
  video_path: string
  video_url: string        // 后端返回，如 /media/xxx.mp4
  created_at?: string | null
  shot_time?: string | null
}

const rows = ref<VideoRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const queryRodId = ref<string>('')

// 播放器
const showPlayer = ref(false)
const current = ref<VideoRow | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

// 若你已按我给的 FastAPI 路由提供按需转码接口，就保持 true；否则设为 false 回退直连 /media
const USE_H264_API = true

// 可选环境变量：VITE_MEDIA_BASE（如 http://127.0.0.1:8000）
// 若你 vite 里已经代理了 /media 到后端，这个可以不配
const MEDIA_BASE = (import.meta as any).env?.VITE_MEDIA_BASE as string | undefined

function toMediaUrl(p: string): string {
  if (!p) return ''
  // 绝对地址直接返回
  if (/^https?:\/\//i.test(p)) return p
  // 有环境变量就用环境变量
  if (MEDIA_BASE) return MEDIA_BASE.replace(/\/+$/, '') + (p.startsWith('/') ? p : '/' + p)
  // 默认：返回相对路径，开发环境通过 /media 代理；生产同域也能用
  return p.startsWith('/') ? p : '/' + p
}

const currentSrc = computed(() => {
  if (!current.value) return ''
  // 点谁拉谁（后端按需转码，返回 302 到 /media_h264/...）
  if (USE_H264_API) {
    return `/api/video_h264?file=${encodeURIComponent(current.value.video_filename)}`
  }
  // 回退走后端给的 video_url 或根据文件名兜底到 /media/<name>
  const direct = current.value.video_url || `/media/${current.value.video_filename}`
  return toMediaUrl(direct)
})

function parseShotTimeFromFilename(name: string): string | null {
  // 支持 20250704_084303.mp4
  const m = name.match(/^(\d{8})_(\d{6})/)
  if (!m) return null
  const d = m[1], t = m[2]
  return dayjs(`${d}${t}`, 'YYYYMMDDHHmmss').format('YYYY-MM-DD HH:mm:ss')
}

function fmtCoord(v: number | null | undefined) {
  if (v === null || v === undefined) return '-'
  return Number(v).toFixed(5)
}

async function load() {
  const rod_id = queryRodId.value ? Number(queryRodId.value) : undefined
  const resp = await apiListVideos({ page: page.value, page_size: pageSize.value, rod_id })
  total.value = resp.total
  rows.value = (resp.items || []).map((it: any) => ({
    ...it,
    // 仅展示：播流走 currentSrc 逻辑
    shot_time: it.created_at
      ? dayjs(it.created_at).format('YYYY-MM-DD HH:mm:ss')
      : parseShotTimeFromFilename(it.video_filename),
  }))
}

function onSearch() {
  page.value = 1
  load()
}
function onReset() {
  queryRodId.value = ''
  page.value = 1
  load()
}
function goto(p: number) {
  page.value = p
  load()
}

function openPlayer(r: VideoRow) {
  current.value = r
  showPlayer.value = true
}
function closePlayer() {
  showPlayer.value = false
  current.value = null
}

// 强制触发加载（避免浏览器不主动拉流）
watch(currentSrc, async (src) => {
  if (!src) return
  await nextTick()
  const v = videoRef.value
  if (!v) return
  try {
    v.load()
    await v.play().catch(() => {})
  } catch {}
})

function onVideoLoaded(ev: Event) {
  const v = ev.target as HTMLVideoElement
  console.log('[video] loadedmetadata:', {
    src: v.currentSrc, readyState: v.readyState, networkState: v.networkState, duration: v.duration
  })
}
function onVideoError(ev: Event) {
  const v = ev.target as HTMLVideoElement
  // @ts-ignore
  const err = v.error
  console.error('[video] error:', {
    src: v.currentSrc, code: err?.code, message: err?.message,
    readyState: v.readyState, networkState: v.networkState
  })
}

onMounted(load)
</script>

<style scoped lang="scss">
.video-list-wrapper {
  width: 100%;
  height: 90%;
  background-image: url('@/assets/images/card_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 20px;
  box-sizing: border-box;
  color: #fff;

  .card-title {
    font-family: 'PangMenZhengDao';
    font-size: 22px;
    display: flex;
    align-items: center;
    position: relative;
    .tit { color: rgb(183, 207, 252); }
    .sub-tit { font-size: 14px; margin-left: 14px; color: #4e5e72; }
    .card-xz { width: 91px; height: 9px; }
    &::before {
      content: ''; width: 10px; height: 10px; background: #00cbff; border-radius: 50%; margin-right: 10px;
    }
    &::after {
      content: ''; position: absolute; left: -10px; top: 12px; width: 98%; height: 20px;
      background-image: url('@/assets/images/line_bg.png'); background-size: 100% 100%; background-repeat: no-repeat;
    }
  }

  .query-bar {
    margin: 20px 0;
    display: flex; gap: 10px; align-items: center;
    input {
      flex: 1; height: 38px; padding: 0 12px; color: #fff;
      background: rgba(11,27,43,0.8); border: 1px solid #1e3146; border-radius: 4px;
      &::placeholder { color: rgba(255,255,255,.4); }
    }
    .btn {
      height: 38px; padding: 0 16px; border: 1px solid #00cbff; background: rgba(0,203,255,.2);
      color:#fff; border-radius: 4px; cursor: pointer;
      &.ghost { background: transparent; border-color:#445769; }
    }
  }

  .table {
    height: calc(100% - 120px);
    display: flex; flex-direction: column;
    .thead, .tr {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 2fr 1.5fr;
      align-items: center;
    }
    .thead {
      height: 40px; background: rgba(8,19,31,.8); color:#00cbff; border-bottom: 1px solid #1e3146;
      .th { padding: 0 12px; }
    }
    .tbody {
      overflow-y: auto; flex: 1;
      .tr {
        height: 40px; border-bottom: 1px solid rgba(30,49,70,.5); font-size: 16px;
        &:nth-child(odd){ background: rgba(11,27,43,.4); }
        &:nth-child(even){ background: rgba(11,27,43,.2); }
        &:hover { background: rgba(30,49,70,.5); }
        .td { padding: 0 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .link { color:#00cbff; text-decoration: underline; cursor: pointer; }
      }
      .empty { text-align:center; padding: 30px 0; color:#999; }
    }
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 12px; padding-top: 10px;
      .pg { height: 30px; padding: 0 12px; border: 1px solid #445769; background: transparent; color:#fff; cursor:pointer; }
      .pg:disabled { opacity: .5; cursor: not-allowed; }
      .pg-info { color:#99a; }
    }
  }

  /* 播放器弹层 */
  .dialog-mask {
    position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 2001;
    display:flex; align-items: center; justify-content: center;
    .dialog {
      width: 70%; height: 70%; background: #001122; border:1px solid #0E94EB; display:flex; flex-direction: column;
      .dialog-hd {
        height: 48px; display:flex; align-items:center; justify-content: space-between;
        padding: 0 12px; border-bottom: 1px solid #0E94EB; background: rgba(11,27,43,.9);
        .title { color:#00cbff; }
        .close { background: transparent; border: none; color:#999; font-size: 24px; cursor: pointer; }
        .close:hover { color:#fff; }
      }
      .dialog-bd { flex:1; padding: 8px; }
    }
  }
}
</style>
