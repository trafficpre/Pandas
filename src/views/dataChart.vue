<template>
  <div class="data-chart-wrapper">
    <div class="card-title">
      <span class="tit">数据可视化</span>
      <span class="sub-tit">Data visualization</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="">
    </div>
    <div class="chart-container">
      <div ref="chartContainer" class="chart-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import http from '@/api/http'

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

type ApiItem = { rod_id: number | string; events: number }
type ApiResp = {
  total_events: number
  rod_count_total: number | null
  rod_count_with_events: number
  items: ApiItem[]
}

let totalEvents = 0
let pieData: { name: string; value: number }[] = []

/** 机械风配色（渐变） */
const COLORS: [string, string][] = [
  ['#7db2ff', '#466bff'],   // 冷蓝
  ['#47e6ff', '#00a7cc'],   // 青蓝
  ['#7ef0c7', '#1dbb8f'],   // 青绿
  ['#ffd580', '#ff9e3d'],   // 琥珀
  ['#d39bff', '#6c4cff'],   // 紫蓝
  ['#ff9ba1', '#ff5c64'],   // 玫红
]

/** 拉数据（只用真实数据，不做示例兜底） */
async function loadData() {
  totalEvents = 0
  pieData = []

  try {
    const { data } = await http.get<ApiResp>('/api/analytics/panda-share', {
      params: { top_n: 9999 } // 每个杆件一个扇区
    })
    const list = (data?.items ?? []) as ApiItem[]
    totalEvents = Number(data?.total_events ?? 0)
    pieData = list.map(it => ({
      name: String(it.rod_id),
      value: Number(it.events || 0)
    }))
  } catch (e) {
    console.error('请求 /api/analytics/panda-share 失败：', e)
    // 失败时保持 total=0、pieData=[]
  } finally {
    renderChart()
  }
}

/** 渲染图表 */
function renderChart() {
  if (!chartContainer.value) return
  if (!chartInstance) chartInstance = echarts.init(chartContainer.value)

  // 是否有有效数据
  const hasData = pieData.length > 0 && pieData.some(d => d.value > 0)

  // 主环数据（含渐变与描边）
  const seriesMainData = hasData
    ? pieData.map((d, i) => ({
      ...d,
      itemStyle: {
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: COLORS[i % COLORS.length][0] },
          { offset: 1, color: COLORS[i % COLORS.length][1] },
        ])
      }
    }))
    : [] // 没数据就不画主环

  // 每次渲染前清空，避免叠加
  chartInstance.clear()

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5,20,40,0.9)',
      borderColor: '#00f6ff',
      borderWidth: 1,
      textStyle: { color: '#b7cffc' },
      formatter: (p: any) => {
        if (!hasData) return '暂无数据'
        return `${p.name}<br/>次数：${p.value}<br/>占比：${p.percent}%`
      },
      extraCssText: 'box-shadow: 0 0 12px rgba(0,246,255,0.4);'
    },
    legend: { show: false },

    title: {
      text: `{t|总计}\n{n|${totalEvents}}`,
      left: 'center',
      top: 'center',
      textStyle: {
        rich: {
          t: { fontSize: 16, color: '#9ecafc', padding: [0, 0, 6, 0] },
          n: { fontSize: 28, color: '#cfe8ff', fontWeight: 'bold' },
        }
      }
    },

    series: [
      /** 外层装饰环（机械风） */
      {
        type: 'pie',
        radius: ['78%', '84%'],
        center: ['50%', '50%'],
        silent: true,
        z: 1,
        label: { show: false },
        data: [{
          value: 1,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: 'rgba(0, 180, 200, 0.15)' },
              { offset: 1, color: 'rgba(0, 90, 120, 0.45)' },
            ])
          }
        }]
      },

      /** 主环（分区）——无数据时不显示 */
      {
        type: 'pie',
        radius: ['48%', '68%'],
        center: ['50%', '50%'],
        clockwise: true,
        avoidLabelOverlap: true,
        z: 3,
        // 仅在有数据时显示 label
        label: hasData
          ? {
            show: true,
            formatter: (p: any) =>
              `{name|${p.name}}\n{val|${p.percent}%}  {cnt|${p.value}次}`,
            rich: {
              name: { color: '#cfe8ff', fontSize: 14, lineHeight: 18 },
              val:  { color: '#8bd7ff', fontSize: 12 },
              cnt:  { color: '#d0d6e0', fontSize: 12 },
            }
          }
          : { show: false },
        labelLine: hasData
          ? {
            show: true,
            length: 18,
            length2: 10,
            lineStyle: { color: 'rgba(135, 210, 255, 0.9)' }
          }
          : { show: false },
        data: seriesMainData
      },

      /** 内圈细描边（机械感） */
      {
        type: 'pie',
        radius: ['44%', '46%'],
        center: ['50%', '50%'],
        silent: true,
        z: 2,
        label: { show: false },
        data: [{ value: 1, itemStyle: { color: 'rgba(160,180,200,0.25)' } }]
      }
    ]
  }

  chartInstance.setOption(option, { notMerge: true, lazyUpdate: false })
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  // 保证容器有尺寸
  setTimeout(async () => {
    if (chartContainer.value && (!chartContainer.value.clientWidth || !chartContainer.value.clientHeight)) {
      chartContainer.value.style.width = '100%'
      chartContainer.value.style.height = '300px'
    }
    await loadData()
    window.addEventListener('resize', handleResize)
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style lang="scss">
.data-chart-wrapper {
  margin-top: 20px;
  width: 100%;
  height: 45%;
  background-image: url('@/assets/images/card_l_b.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 20px;
  box-sizing: border-box;
  color: #fff;

  .chart-container {
    margin-top: 40px;
    width: 80%;
    height: 300px;       /* 固定高度，保证 ECharts 有画布 */
    position: relative;
  }

  .chart-inner {
    position: absolute;
    inset: 0;
  }

  .card-title {
    font-family: 'PangMenZhengDao';
    font-size: 22px;
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 10px;
      height: 10px;
      background: rgb(0, 203, 255);
      border-radius: 50%;
      margin-right: 10px;
    }

    &::after {
      content: '';
      position: absolute;
      left: -10px;
      top: 12px;
      width: 80%;
      height: 20px;
      background-image: url('@/assets/images/line_bg.png');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center;
    }

    .tit { color: rgb(183, 207, 252); }
    .sub-tit { font-size: 14px; margin-left: 14px; color: #4e5e72; }
    .card-xz { width: 91px; height: 9px; }
  }
}
</style>
