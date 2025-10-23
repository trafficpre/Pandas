<template>
  <div class="map-heat-wrapper">
    <div ref="mapContainer" class="map-canvas"></div>

    <!-- 图例 -->
    <div class="legend">
      <span class="swatch red"></span> 上：高（红）
      <span class="swatch yellow"></span> 中：中（黄）
      <span class="swatch green"></span> 下：低（绿）
      <span class="meta">（阈值：红 ≥ {{ redTh }}，黄 ≥ {{ yellowTh }}）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import beijing from '@/assets/jsons/beijing.json'

type LngLat = [number, number]
type ZoneItem = {
  name: string
  count?: number
  level?: 'high' | 'mid' | 'low' | null
  color?: string
}

const mapContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let ro: ResizeObserver | null = null

// 地图视图
const MAP_NAME = 'beijing'
const CENTER: LngLat = [116.397428, 40.199187]
const ZOOM = 1.1

// 阈值（和后端统计保持一致）
const redTh = ref(10)
const yellowTh = ref(5)

// 颜色
const COLORS = {
  high: 'rgba(255, 64, 64, 0.32)',
  mid:  'rgba(255,214,  0, 0.28)',
  low:  'rgba(  0,200,120,0.26)',
}

// 统一 API 前缀
const API_BASE = '/api/analytics/heatmap'

function registerMap() {
  try { echarts.registerMap(MAP_NAME, beijing as any) }
  catch (e) { console.error('[heatmap] registerMap failed:', e) }
}

/** 依次尝试多个 URL（先新接口，再兼容旧接口） */
async function tryFetch<T>(urls: string[]): Promise<T> {
  let lastErr: any
  for (const u of urls) {
    try {
      const r = await fetch(u, { credentials: 'include' })
      if (r.ok) return await r.json()
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('all endpoints failed')
}

/** 拉取后端分区统计（优先 zone-colors，回退 colors） */
async function fetchZoneStats(): Promise<ZoneItem[]> {
  const q = `?gte_red=${redTh.value}&gte_yellow=${yellowTh.value}`
  const json = await tryFetch<any>([
    `${API_BASE}/zone-colors${q}`,   // ✅ 正式接口
    `${API_BASE}/colors${q}`,        // 兼容旧接口
  ])
  const list: ZoneItem[] = json?.zones || json?.data || json || []
  return Array.isArray(list) ? list : []
}

/** 把后端数据映射为 ECharts map 的 data（保持你满意的填充逻辑） */
function buildRegionFillData(stats: ZoneItem[]) {
  const name2stat = new Map<string, ZoneItem>()
  stats.forEach(s => name2stat.set(String(s.name), s))

  const data: Array<{ name: string; itemStyle: any; value?: number }> = []

  for (const f of (beijing as any).features || []) {
    const name: string =
      (f.properties && (f.properties.name || f.properties.NAME || f.properties.adcode)) || ''

    const s = name2stat.get(name)
    if (!s) {
      // 无记录/无杆件：不填色（透明）
      data.push({ name, itemStyle: { areaColor: 'transparent' } })
      continue
    }

    let areaColor = s.color
    if (!areaColor) {
      let level = s.level
      if (!level) {
        const c = Number(s.count || 0)
        level = c >= redTh.value ? 'high' : (c >= yellowTh.value ? 'mid' : 'low')
      }
      areaColor = COLORS[level]
    }

    data.push({ name, value: Number(s.count ?? 0), itemStyle: { areaColor } })
  }
  return data
}

/** 从 GeoJSON 提取所有边界为 polyline（外轮廓+内部分界），用于 lines 系列 */
function buildBorderPolylines(geojson: any) {
  const lines: Array<{ coords: LngLat[] }> = []

  const pushRing = (ring: number[][]) => {
    if (!ring || ring.length < 2) return
    const coords: LngLat[] = ring.map(pt => [pt[0], pt[1]])
    // 保证闭合，视觉更顺滑
    const first = coords[0], last = coords[coords.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
    lines.push({ coords })
  }

  for (const f of geojson.features || []) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates) pushRing(ring as number[][])
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates) {
        for (const ring of poly as number[][][]) pushRing(ring)
      }
    }
  }
  return lines
}
const BORDER_LINES = buildBorderPolylines(beijing as any)

function baseOption(): echarts.EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}<br/>识别次数：${p.value ?? '—'}`
    },
    geo: {
      map: MAP_NAME,
      roam: true,
      center: CENTER,
      zoom: ZOOM,
      itemStyle: { areaColor: 'transparent', borderColor: 'transparent' },
      emphasis: { itemStyle: { areaColor: 'transparent' } },
      silent: true
    },
    series: [
      // ✅ 你的着色层（保持不变）
      {
        name: 'heat-bands',
        type: 'map',
        map: MAP_NAME,
        z: 1,
        selectedMode: false,
        center: CENTER,
        zoom: ZOOM,
        itemStyle: { borderColor: 'transparent', borderWidth: 0 },
        data: []
      },

      // ✨ 蓝色轮廓（光晕）
      {
        name: 'borders-glow',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        silent: true,
        zlevel: 3,
        // @ts-ignore
        blendMode: 'lighter',
        lineStyle: {
          width: 10,
          color: 'rgba(14,148,235,0.28)',
          opacity: 1
        },
        data: BORDER_LINES as any
      },

      // ✨ 蓝色轮廓（主线）——始终在最上层
      {
        name: 'borders-main',
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        silent: true,
        zlevel: 4,
        lineStyle: {
          width: 4,
          color: '#0E94EB',
          opacity: 1
        },
        data: BORDER_LINES as any
      }
    ]
  }
}

function syncRoam() {
  if (!chart) return
  const opt = chart.getOption() as any
  const geo = opt?.geo?.[0]
  if (!geo) return
  // 只需要同步你的着色 map 系列；lines 会自动跟随 geo
  chart.setOption({
    series: [
      { center: geo.center, zoom: geo.zoom } // heat-bands
    ]
  })
}

async function init() {
  if (!mapContainer.value) return
  chart?.dispose()
  chart = echarts.init(mapContainer.value)
  chart.setOption(baseOption())
  chart.resize()
  chart.on('georoam', syncRoam)

  try {
    const stats = await fetchZoneStats()
    const regionFillData = buildRegionFillData(stats)
    chart.setOption({ series: [{ data: regionFillData }] })
  } catch (e) {
    console.error('[heatmap] fetch/paint failed:', e)
  }
}

onMounted(async () => {
  registerMap()
  await nextTick()
  setTimeout(() => {
    init()
    if (mapContainer.value) {
      ro = new ResizeObserver(() => chart?.resize())
      ro.observe(mapContainer.value)
    }
    const onWinResize = () => chart?.resize()
    window.addEventListener('resize', onWinResize)
    ;(chart as any).__onWinResize = onWinResize
  }, 80)
})

onUnmounted(() => {
  if (chart && (chart as any).__onWinResize) {
    window.removeEventListener('resize', (chart as any).__onWinResize)
  }
  ro?.disconnect(); ro = null
  chart?.dispose(); chart = null
})
</script>

<style scoped>
.map-heat-wrapper { position: relative; width: 100%; height: 100%; }
.map-canvas      { position: absolute; inset: 0; min-height: 600px; }
.legend {
  position: absolute; right: 16px; bottom: 16px; z-index: 10;
  background: rgba(0,17,34,0.7); border: 1px solid #0E94EB; padding: 8px 10px; font-size: 12px;
}
.legend .swatch {
  display: inline-block; width: 14px; height: 10px; margin: 0 6px 0 10px; vertical-align: -1px;
  border: 1px solid rgba(255,255,255,0.3);
}
.legend .red    { background: rgba(255, 64, 64, 0.6); }
.legend .yellow { background: rgba(255,214,  0, 0.6); }
.legend .green  { background: rgba(  0,200,120,0.6); }
.legend .meta   { margin-left: 10px; opacity: .85; }
</style>
