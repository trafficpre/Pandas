<template>
  <div id="smart-wrapper" class="smart-district-city">
    <div class="header-box">
      <span>能源自洽大熊猫检测平台</span>
      <!-- 跳转按钮 -->
      <button class="about-btn" @click="goAbout">设备信息</button>
    </div>

    <div class="smart-content">
      <div class="s-c-left">
        <deviceInfo ref="deviceInfoRef" />
        <dataChart ref="dataChartRef" />
      </div>
      <div class="s-c-center">
        <mapChart ref="mapRef" />
      </div>
      <div class="s-c-right">
        <dataChartRt ref="dataChartRtRef" />
        <dataChartRb ref="dataChartRbRef" />
      </div>
    </div>

    <!-- 进度抽屉面板（自动显隐，右侧滑出） -->
    <UavProgressPanel
      :visible="uav.visible"
      :mission="uav.mission"
      :progress="uav.progress"
      :total="uav.total"
      :sent="uav.sent"
      :stalled="uav.stalled"
      :failed="uav.failed"
      :done="uav.done"
      :updatedAt="uav.updatedAt"
      @close="uav.hide()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import autofit from 'autofit.js'

import deviceInfo from './deviceInfo.vue'
import dataChart from './dataChart.vue'
import dataChartRt from './dataChartRt.vue'
import dataChartRb from './dataChartRb.vue'
import mapChart from './mapChart.vue'

import UavProgressPanel from '@/components/UavProgressPanel.vue'
import { useUavProgress } from '@/composable/useUavProgress'

const router = useRouter()

// 点击跳转
const goAbout = () => router.push('/about')

// 原有 ref
const deviceInfoRef = ref<InstanceType<typeof deviceInfo>>()
const dataChartRef = ref<InstanceType<typeof dataChart>>()
const dataChartRtRef = ref<InstanceType<typeof dataChartRt>>()
const dataChartRbRef = ref<InstanceType<typeof dataChartRb>>()
const mapRef = ref<InstanceType<typeof mapChart>>()

// 无人机进度（自动轮询 / 自动弹出与收起）
const uav = useUavProgress()

onMounted(() => {
  autofit.init({
    dh: 1080,
    dw: 1920,
    el: '#smart-wrapper',
    resize: true,
  })
  uav.start()
})

onBeforeUnmount(() => {
  uav.stop()
})
</script>

<style lang="scss">
.smart-district-city {
  width: 100%;
  height: 100%;
  background-color: #020F17;
  color: #fff;

  @font-face {
    font-family: 'PangMenZhengDao';
    src: url('@/assets/fonts/PangMenZhengDao.ttf');
  }

  .header-box {
    width: 100%;
    height: 80px;
    background-image: url('@/assets/images/head_bg.png');
    background-size: 3000px 100%;
    background-repeat: no-repeat;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'PangMenZhengDao';
    font-size: 40px;
    letter-spacing: 2px;
    position: relative;

    span {
      background-image: linear-gradient(to bottom, rgb(232, 239, 251), rgb(179, 205, 252));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .about-btn {
      position: absolute;
      right: 20px;
      top: 20px;
      padding: 6px 14px;
      font-size: 14px;
      background: rgba(0, 203, 255, 0.2);
      border: 1px solid #00cbff;
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(0, 203, 255, 0.4);
      }
    }
  }

  /* 预览按钮（确认样式后可删除） */
  .preview-btn {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 10000;
    height: 36px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid rgba(0,200,255,.35);
    background: rgba(3,29,41,.6);
    color: #cfe9ff;
    cursor: pointer;
  }
  .preview-btn:hover { box-shadow: 0 0 0 2px rgba(0,200,255,.12) inset; }
}
</style>
