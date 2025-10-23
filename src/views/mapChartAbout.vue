<template>
  <div class="map-wrap">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-about"></div>

    <!-- 图例：绿色=推荐杆，黄色=现有杆 -->
    <div class="map-legend">
      <div class="item">
        <span class="dot rec"></span>
        <span>推荐杆（绿色）</span>
      </div>
      <div class="item">
        <span class="ring exist"><span class="inner"></span></span>
        <span>现有杆（黄色）</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import beijing from '@/assets/jsons/beijing.json'

const mapContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

// ===== 地图名 & 中心（与你首页一致）=====
const MAP_NAME = 'beijing'
const CENTER: [number, number] = [116.397428, 40.199187]

// ===== 参数（单位：米）=====
// 覆盖半径（推荐点的圈半径）——要 ≥ 避让距离，才能既远离现有杆又有增益
const R_COVER = 9900
// 新杆与“现有杆”的最小距离
const MIN_DIST_FROM_EXISTING = 9800
// 新杆之间的最小距离
const MIN_DIST_BETWEEN_NEW = 600
// 候选栅格步长 & 推荐数量
const GRID_SIZE = 200
const K_RECOMMEND = 8

// 视觉增强
const SHOW_HEATMAP = true
const HEAT_POINT_SIZE = 10
const HEAT_BLUR = 18
const DPR_BOOST = 1.4 // 渲染清晰度微提升（过大耗性能）

// ===== 工具：米 <-> 经纬度（近似）=====
function metersToDeg(lat: number, dx_m: number, dy_m: number) {
  const dlat = dy_m / 111320
  const dlon = dx_m / (111320 * Math.max(1e-6, Math.cos((lat * Math.PI) / 180)))
  return { dlon, dlat }
}

function registerMap() {
  try { echarts.registerMap(MAP_NAME, beijing as any) } catch {}
}

// ===== 后端数据结构 =====
type ApiResp = {
  summary: { total_heat: number; covered_by_existing: number; new_gain: number; marginal_gains: number[] }
  recommendations: { rank: number; lng: number; lat: number; gain: number; covered_rod_ids: number[] }[]
  circles: { lng: number; lat: number; R: number }[]
  heat_points: { lng: number; lat: number; value: number; rod_id: number }[]
  debug?: any
}

// ===== 拉取推荐 =====
async function fetchRecommend(): Promise<ApiResp | null> {
  try {
    const payload = {
      R: R_COVER,
      grid_size: GRID_SIZE,
      K: K_RECOMMEND,
      min_dist: MIN_DIST_BETWEEN_NEW,
      min_dist_from_existing: MIN_DIST_FROM_EXISTING,
      dedup_existing: false
    }
    const res = await fetch('/api/rod-planner/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('[mapChartAbout] 获取推荐失败：', e)
    return null
  }
}

// ===== 构造 option =====
function buildOption(data: ApiResp | null): echarts.EChartsOption {
  const heatPoints = data?.heat_points || []
  const heatData: [number, number, number][] = heatPoints.map(p => [p.lng, p.lat, p.value])
  const heatMax = heatData.length ? Math.max(...heatData.map(d => d[2])) : 0

  // 现有杆（有记录）
  const existing = heatPoints.map(p => ({
    name: `rod ${p.rod_id}`,
    value: [p.lng, p.lat, p.value],
    rod_id: p.rod_id,
    heat: p.value
  }))

  // 推荐点
  const recPoints = (data?.recommendations || []).map(d => ({
    name: `#${d.rank}`,
    value: [d.lng, d.lat, d.gain],
    gain: d.gain,
    rank: d.rank
  }))

  // 覆盖圈
  const recCircles = (data?.circles || []).map(c => [c.lng, c.lat, c.R])

  // 现有杆禁装缓冲圈
  const existingBuffers = existing.map(p => [p.value[0], p.value[1], MIN_DIST_FROM_EXISTING])

  return {
    backgroundColor: 'transparent',
    geo: {
      map: MAP_NAME,
      roam: true,
      center: CENTER,
      zoom: 1.1,
      itemStyle: { areaColor: 'transparent', borderColor: '#0E94EB', borderWidth: 2 },
      emphasis: { itemStyle: { areaColor: 'rgba(14,148,235,.08)' } },
      silent: false
    },
    visualMap: SHOW_HEATMAP && heatData.length
      ? {
        type: 'continuous',
        min: 0, max: Math.max(1, heatMax),
        calculable: false,
        inRange: { color: ['rgba(0,192,255,0.0)', 'rgba(0,192,255,0.25)', 'rgba(255,128,0,0.45)'] },
        show: false
      }
      : undefined,
    series: [
      // 外发光
      { name: '地图外发光', type: 'map', map: MAP_NAME, center: CENTER, zoom: 1.1, silent: true, zlevel: -2,
        itemStyle: { areaColor: 'transparent', borderColor: '#0E94EB', borderWidth: 6 } },
      // 光晕
      { name: '地图光晕', type: 'map', map: MAP_NAME, center: CENTER, zoom: 1.1, silent: true, zlevel: -3,
        itemStyle: { areaColor: 'transparent', borderColor: 'rgba(14,148,235,.2)', borderWidth: 10 } },

      // 热力（降低模糊度，避免发虚）
      ...(SHOW_HEATMAP && heatData.length ? [{
        name: '热度',
        type: 'heatmap',
        coordinateSystem: 'geo',
        data: heatData,
        pointSize: HEAT_POINT_SIZE,
        blurSize: HEAT_BLUR,
        zlevel: 0
      } as echarts.SeriesOption] : []),

      // 现有杆禁装缓冲圈（红色虚线圈）
      ...(existingBuffers.length ? [{
        name: '禁装缓冲圈',
        type: 'custom',
        coordinateSystem: 'geo',
        renderItem(params: any, api: any) {
          const lng = api.value(0), lat = api.value(1), R = api.value(2)
          const p0 = api.coord([lng, lat])
          const { dlon } = metersToDeg(lat, R, 0)
          const p1 = api.coord([lng + dlon, lat])
          const r = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
          return {
            type: 'circle',
            shape: { cx: p0[0], cy: p0[1], r },
            style: {
              fill: 'rgba(255,0,0,0.03)',
              stroke: 'rgba(255,80,80,0.85)',
              lineWidth: 1.6,
              lineDash: [6, 7]
            }
          }
        },
        data: existingBuffers,
        silent: true,
        zlevel: 1
      } as echarts.SeriesOption] : []),

      // 推荐覆盖圈（更清晰）
      ...(recCircles.length ? [{
        name: '覆盖圈',
        type: 'custom',
        coordinateSystem: 'geo',
        renderItem(params: any, api: any) {
          const lng = api.value(0), lat = api.value(1), R = api.value(2)
          const p0 = api.coord([lng, lat])
          const { dlon } = metersToDeg(lat, R, 0)
          const p1 = api.coord([lng + dlon, lat])
          const r = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
          return {
            type: 'circle',
            shape: { cx: p0[0], cy: p0[1], r },
            style: {
              fill: 'rgba(0,203,255,0.12)',
              stroke: 'rgba(0,255,255,0.95)',
              lineWidth: 2
            }
          }
        },
        data: recCircles,
        silent: true,
        zlevel: 1
      } as echarts.SeriesOption] : []),

      // 现有杆（空心环）
      ...(existing.length ? [{
        name: '现有杆位(有记录)',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: existing,
        symbol: 'emptyCircle',
        symbolSize: (val: any) => Math.max(10, Math.min(14, 6 + Math.sqrt(val[2] ?? 1))),
        itemStyle: {
          color: 'rgba(0,0,0,0)',
          borderColor: '#FFC107',
          borderWidth: 3,
          shadowBlur: 8,
          shadowColor: 'rgba(255,193,7,0.6)'
        },
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => `rod:${p.data.rod_id}`,
          color: '#FFD982',
          fontSize: 13,
          fontWeight: 'bold',
          padding: [2, 4],
          backgroundColor: 'rgba(0,0,0,.45)',
          borderColor: 'rgba(255,193,7,.45)',
          borderWidth: 1,
          borderRadius: 3
        },
        zlevel: 2,
        z: 2
      } as echarts.SeriesOption] : []),

      // 现有杆小内点（增强辨识）
      ...(existing.length ? [{
        name: '现有杆-内点',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: existing.map(p => ({ value: [p.value[0], p.value[1]] })),
        symbol: 'circle',
        symbolSize: 4,
        itemStyle: { color: '#FFC107' },
        zlevel: 2,
        z: 3
      } as echarts.SeriesOption] : []),

      // 推荐新杆位——绿色呼吸点（更亮、更大）
      ...(recPoints.length ? [{
        name: '推荐杆位',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: recPoints,
        symbolSize: 14,
        itemStyle: {
          color: '#00FF99',
          borderColor: '#00FFC2',
          borderWidth: 2,
          shadowBlur: 16,
          shadowColor: '#00FFC2'
        },
        showEffectOn: 'render',
        rippleEffect: { period: 3.5, scale: 4, brushType: 'stroke' },
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => `#${p.data.rank}  +${Math.round(p.data.gain)}`,
          color: '#CFFFF0',
          fontSize: 14,
          fontWeight: 'bold',
          padding: [3, 6],
          backgroundColor: 'rgba(0,0,0,0.75)',
          borderColor: 'rgba(0,255,194,0.8)',
          borderWidth: 1.2,
          borderRadius: 4,
          textShadowColor: '#000',
          textShadowBlur: 2
        },
        zlevel: 3
      } as echarts.SeriesOption] : [])
    ]
  }
}

// 同步“外发光/光晕”的漫游
function syncRoam() {
  if (!chart) return
  const option = chart.getOption() as any
  const geo = option?.geo?.[0]
  if (!geo) return
  chart.setOption({
    series: [
      { name: '地图外发光', center: geo.center, zoom: geo.zoom },
      { name: '地图光晕', center: geo.center, zoom: geo.zoom }
    ]
  })
}

async function initChart() {
  if (!mapContainer.value) return
  if (chart) { chart.dispose(); chart = null }
  const dpr = Math.min((window.devicePixelRatio || 1) * DPR_BOOST, 2)
  chart = echarts.init(mapContainer.value, undefined, { devicePixelRatio: dpr })
  chart.showLoading({ text: '加载中...', color: '#00cbff' })
  const data = await fetchRecommend()
  chart.hideLoading()
  chart.setOption(buildOption(data))
  chart.resize()
  chart.on('georoam', () => syncRoam())
}

onMounted(async () => {
  registerMap()
  await nextTick()
  setTimeout(() => {
    initChart()
    if (mapContainer.value) {
      ro = new ResizeObserver(() => chart?.resize())
      ro.observe(mapContainer.value)
    }
    const onWinResize = () => chart?.resize()
    window.addEventListener('resize', onWinResize)
    ;(chart as any).__onWinResize = onWinResize
  }, 120)
})

onUnmounted(() => {
  if (chart && (chart as any).__onWinResize) {
    window.removeEventListener('resize', (chart as any).__onWinResize)
  }
  ro?.disconnect()
  ro = null
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-about {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: transparent;
}

/* 图例：绿色=推荐杆，黄色=现有杆 */
.map-legend {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0,0,0,0.55);
  border: 1px solid rgba(0,203,255,0.4);
  border-radius: 6px;
  pointer-events: none; /* 不阻挡地图拖拽/缩放 */
}

.map-legend .item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cfefff;
  font-size: 12px;
  white-space: nowrap;
}

/* 绿色：推荐杆 */
.map-legend .dot.rec {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00ff99;
  border: 1px solid #00ffc2;
  box-shadow: 0 0 8px #00ffc2, inset 0 0 8px #00ffc2;
}

/* 黄色：现有杆（空心环 + 小内点） */
.map-legend .ring.exist {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ffc107;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.map-legend .ring.exist .inner {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffc107;
}
</style>
