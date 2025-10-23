<template>
  <div class="data-chart-rt-wrapper">
    <div class="card-title">
      <span class="tit"></span>
      <span class="sub-tit">Data visualization</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="" />

      <div class="rod-select">
        <label>杆件：</label>
        <select v-model="currentRodId" @change="reload()" class="rod-select-el">
          <option v-for="rid in rodList" :key="rid" :value="rid">{{ rid }}</option>
        </select>
      </div>
    </div>

    <div class="chart-container">
      <div class="unit-label">单位：%</div>
      <div ref="chartContainer" class="chart-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { apiBatteryDaily, type DailyPoint } from '@/api/battery'
import { apiRodIds } from '@/api/rods'

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const rodList = ref<number[]>([])
const currentRodId = ref<number | null>(null)

const xData = ref<string[]>([])
const yData = ref<(number | null)[]>([])

const RECENT_DAYS = 14

function getDateRange(nDays: number) {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(nDays - 1, 'day').format('YYYY-MM-DD')
  return { start, end }
}

async function reload() {
  if (!currentRodId.value) return
  const { start, end } = getDateRange(RECENT_DAYS)
  const resp = await apiBatteryDaily({ rod_id: currentRodId.value, start, end, fill: true })
  const xs: string[] = []
  const ys: (number | null)[] = []
  ;(resp.points || []).forEach((p: DailyPoint) => { xs.push(p.date); ys.push(p.battery_soc ?? null) })
  xData.value = xs
  yData.value = ys
  renderChart()
}

function renderChart() {
  if (!chartContainer.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
    window.addEventListener('resize', handleResize)
  }
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    // ↑ 往上提：减小 bottom、略减 top
    grid: { top: '10%', left: '3%', right: '5%', bottom: '2%', containLabel: true },
    legend: {
      right: '5%', top: 0, itemWidth: 15, itemHeight: 3,
      itemStyle: { borderWidth: 0 }, textStyle: { color: '#fff', fontSize: 12 },
      data: ['电量SOC(%)']
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData.value,
      axisLine: { show: true, lineStyle: { color: 'rgba(76, 95, 116, 0.5)' } },
      axisTick: { show: false },
      // ↑ 标签更贴近轴线
      axisLabel: { color: '#fff', fontSize: 12, margin: 6, formatter: (v: string) => dayjs(v).format('MM-DD') },
      splitLine: { show: true, lineStyle: { color: 'rgba(76,95,116,0.3)', type: 'dashed' } }
    },
    yAxis: {
      type: 'value', min: 0, max: 100, interval: 20,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#fff', fontSize: 12, margin: 12 },
      splitLine: { lineStyle: { color: 'rgba(76,95,116,0.3)', type: 'dashed' } }
    },
    tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? '--' : `${v}%`), axisPointer: { type: 'line' } },
    series: [
      {
        name: '电量SOC(%)',
        type: 'line',
        smooth: true,
        connectNulls: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: '#00C8FF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            { offset: 0, color: 'rgba(0,200,255,0.3)' },
            { offset: 0.8, color: 'rgba(0,200,255,0.05)' }
          ])
        },
        z: 2,
        data: yData.value
      }
    ]
  }
  chartInstance.setOption(option)
}
function handleResize(){ if (chartInstance) chartInstance.resize() }

onMounted(async () => {
  try {
    rodList.value = await apiRodIds()
    if (rodList.value.length > 0) {
      currentRodId.value = rodList.value[0]
      await reload()
    }
  } catch (e) { console.error('加载杆件/电量数据失败：', e) }
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance){ chartInstance.dispose(); chartInstance = null }
})
</script>

<style lang="scss">
.data-chart-rt-wrapper {
  width: 100%;
  height: 45%;
  background-image: url('@/assets/images/card_r_t.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 12px 20px 16px 10%;
  box-sizing: border-box;

  .card-title {
    font-family: 'PangMenZhengDao';
    font-size: 22px;
    display: flex; align-items: center; position: relative;
    height: 56px; /* 固定标题高，便于下方容器计算 */
    &::before { content: ''; width: 10px; height: 10px; background: #00cbff; border-radius: 50%; margin-right: 10px; }
    &::after  { content: ''; position: absolute; left: -10px; top: 12px; width: 90%; height: 20px; background-image: url('@/assets/images/line_bg.png'); background-size: 100% 100%; background-repeat: no-repeat; background-position: center; }
    .tit { color: rgb(183,207,252); }
    .sub-tit { font-size: 14px; margin-left: 14px; color: #4e5e72; }
    .card-xz { width: 91px; height: 9px; }
    .rod-select {
      margin-left: auto; display: flex; align-items: center; gap: 6px; color: #9fb5cc; font-size: 12px;
      .rod-select-el { background: rgba(0,0,0,.25); border: 1px solid rgba(0,203,255,.35); color: #cfe9ff; padding: 2px 8px; border-radius: 4px; outline: none; }
    }
  }

  .chart-container {
    width: 90%;
    height: calc(100% - 56px); /* 去掉 margin-top，用固定高度吃满标题下方 */
    position: relative;
    margin-left: 10%;
  }
  .chart-inner { width: 100%; height: 100%; }
  .unit-label { position: absolute; left: 0; top: 0; font-size: 14px; color: #fff; z-index: 10; }
}
</style>
