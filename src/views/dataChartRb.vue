<template>
  <div class="data-chart-rb-wrapper rb-no-vertical">
    <!-- 标题区 -->
    <div class="card-title">
      <span class="tit">监测次数</span>
      <span class="sub-tit">Monitoring count</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="" />

      <!-- 右侧下拉 -->
      <div class="rod-select">
        <label>杆件：</label>
        <select v-model="currentRodId" @change="reload()" class="rod-select-el">
          <option v-for="rid in rodList" :key="rid" :value="rid">{{ rid }}</option>
        </select>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-container">
      <div class="unit-label">单位：次</div>
      <div ref="chartContainer" class="chart-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { apiPandaMonthly, type PandaMonthlyItem } from '@/api/panda'
import { apiRodIds } from '@/api/rods'

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const rodList = ref<number[]>([])
const currentRodId = ref<number | null>(null)

const xData = ref<string[]>([])
const barData = ref<number[]>([])
const lineData = ref<number[]>([])

const RECENT_MONTHS = 12

function getMonthRange(n: number) {
  const end = dayjs().startOf('month')
  const start = end.subtract(n - 1, 'month')
  return { start_month: start.format('YYYY-MM'), end_month: end.format('YYYY-MM') }
}

async function reload() {
  if (!currentRodId.value) return
  const { start_month, end_month } = getMonthRange(RECENT_MONTHS)
  const resp = await apiPandaMonthly({ rod_id: currentRodId.value, start_month, end_month, fill: true })

  const xs: string[] = []
  const bars: number[] = []
  ;(resp.points || []).forEach((p: PandaMonthlyItem) => {
    xs.push(p.month)
    bars.push(p.count || 0)
  })
  xData.value = xs
  barData.value = bars
  lineData.value = bars.slice()
  renderChart()
}

function initChart() {
  if (!chartContainer.value) return
  chartInstance = echarts.init(chartContainer.value)
  renderChart()
  window.addEventListener('resize', handleResize)
}

function renderChart() {
  if (!chartInstance) return
  const maxV = Math.max(0, ...barData.value)

  // 顶部两行：①单位（26px）②图例（26px）+ 缓冲（12px）
  const HEADER_H = 26
  const LEGEND_H = 26
  const GAP_H = 12

  const option = {
    backgroundColor: 'transparent',
    legend: {
      right: 12,
      top: HEADER_H, // 第二行放图例
      itemWidth: 12,
      itemHeight: 6,
      textStyle: { color: '#cfe9ff', fontSize: 12 },
      data: ['数据1', '数据2'], // 数据2=柱 数据1=线
    },
    grid: {
      top: HEADER_H + LEGEND_H + GAP_H, // 腾出两行+缓冲
      left: '6%',
      right: '6%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData.value.map((m) => dayjs(m).format('YYYY-MM')),
      axisLine: { show: true, lineStyle: { color: 'rgba(76,95,116,0.5)' } },
      axisTick: { show: false },
      axisLabel: { color: '#cfe9ff', fontSize: 12, margin: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.max(10, Math.ceil((maxV + 2) / 10) * 10),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#cfe9ff', fontSize: 12, margin: 10 },
      splitLine: { lineStyle: { color: 'rgba(76,95,116,0.28)', type: 'dashed' } },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(6, 20, 35, 0.9)',
      borderColor: 'rgba(0, 200, 255, 0.4)',
      textStyle: { color: '#cfe9ff' },
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,200,255,0.35)', type: 'dashed' } },
      formatter: (params: any[]) => {
        const pBar = params.find((p) => p.seriesType === 'bar')
        const val = pBar ? pBar.data : 0
        const name = params[0]?.axisValueLabel || ''
        return `${name}<br/>监测次数：${val} 次`
      },
    },
    series: [
      {
        name: '数据2',
        type: 'bar',
        barWidth: '38%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 217, 83, 0.95)' },
            { offset: 0.5, color: 'rgba(255, 160, 0, 0.65)' },
            { offset: 1, color: 'rgba(50, 50, 0, 0.30)' },
          ]),
          borderRadius: [5, 5, 0, 0],
        },
        z: 1,
        data: barData.value,
      },
      {
        name: '数据1',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#00C8FF', borderColor: '#00C8FF' },
        lineStyle: { width: 2.5, color: '#00C8FF' },
        emphasis: { itemStyle: { color: '#00C8FF', borderColor: '#fff', borderWidth: 2 } },
        z: 2,
        data: lineData.value,
      },
    ],
  }
  chartInstance.setOption(option as any)
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

onMounted(async () => {
  try {
    // 先初始化图表，再拉取数据，避免首次渲染尺寸抖动
    initChart()
    rodList.value = await apiRodIds()
    if (rodList.value.length > 0) {
      currentRodId.value = rodList.value[0]
      await reload()
    }
  } catch (e) {
    console.error('加载杆件/监测数据失败：', e)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
/* 彻底隔离任何全局竖排或旋转样式，保证本卡片横排 */
.rb-no-vertical, .rb-no-vertical * {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  transform: none !important;
}

/* ======= 卡片容器 ======= */
.data-chart-rb-wrapper {
  margin-top: 18px;
  width: 100%;
  height: 45%;
  background-image: url('@/assets/images/card_r_b.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;

  /* 左侧背景装饰较宽：给足留白，避免标题被压住
     如仍偏紧，可把 15% 调成 16%~18% */
  padding: 12px 18px 16px 15%;
  box-sizing: border-box;

  /* ======= 标题区 ======= */
  .card-title {
    font-family: 'PangMenZhengDao';
    font-size: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    height: 56px;
    z-index: 2; /* 让标题区整体在装饰线之上 */

    &::before {
      content: '';
      width: 10px; height: 10px;
      background: rgb(0, 203, 255);
      border-radius: 50%;
      margin-right: 10px;
      position: relative;
      z-index: 2;
    }
    &::after {
      /* 装饰线背景，放在底层，避免遮住“杆件：” */
      content: '';
      position: absolute;
      left: -10px; top: 14px;
      width: 94%; height: 20px;
      background-image: url('@/assets/images/line_bg.png');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center;
      z-index: 0; /* 关键：装饰线放到底层 */
      pointer-events: none;
    }

    .tit { color: rgb(183, 207, 252); white-space: nowrap; position: relative; z-index: 2; }
    .sub-tit { font-size: 14px; color: #4e5e72; white-space: nowrap; position: relative; z-index: 2; }
    .card-xz { width: 91px; height: 9px; position: relative; z-index: 2; }

    .rod-select {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      position: relative;
      z-index: 3; /* 最上层，确保不被任何装饰遮住 */

      label {
        color: #cfe9ff;
        opacity: 0.98;
        text-shadow: 0 0 6px rgba(0, 200, 255, 0.35);
        font-size: 13px;
      }
      .rod-select-el {
        height: 26px;
        line-height: 26px;
        background: rgba(3, 29, 41, 0.55);
        border: 1px solid rgba(0, 203, 255, 0.55);
        color: #e8f6ff;
        padding: 0 10px;
        border-radius: 6px;
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 203, 255, 0.08) inset;
      }
    }
  }

  /* ======= 图表容器 ======= */
  .chart-container {
    width: 100%;
    height: calc(100% - 56px);
    position: relative;
  }
  .chart-inner { width: 100%; height: 100%; }

  /* 第一行：单位 */
  .unit-label {
    position: absolute;
    left: 0;
    top: 0;
    font-size: 13px;
    color: #cfe9ff;
    z-index: 10;
    letter-spacing: 1px;
    pointer-events: none;
    text-shadow: 0 0 6px rgba(0, 200, 255, 0.25);
  }
}
</style>
