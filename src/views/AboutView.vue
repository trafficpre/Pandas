<!-- src/views/AboutView.vue -->
<template>
  <div id="smart-wrapper" class="smart-district-city">
    <div class="header-box">
      <span>能源自洽大熊猫检测平台</span>
      <button class="back-btn" @click="goHome">返回首页</button>
    </div>

    <div class="smart-content">
      <div class="s-c-left">
        <!-- 用视频列表替代原 deviceInfoTwo -->
        <VideoList />
      </div>

      <div class="s-c-center">
        <!-- 关于页单独地图：如果你已经建了 mapChartAbout.vue，就用它；没有的话仍用 mapChart.vue -->
        <mapChartAbout />
        <!-- 或者：<mapChart /> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import autofit from 'autofit.js'
import VideoList from './VideoList.vue'
import mapChartAbout from './mapChartAbout.vue' // 若你用的是 mapChart.vue 请改为对应组件

const router = useRouter()
const goHome = () => router.push('/')

onMounted(() => {
  autofit.init({ dh: 1080, dw: 1920, el: '#smart-wrapper', resize: true })
})
</script>

<style lang="scss">
.smart-district-city {
  width: 100%; height: 100%; background-color: #020F17; color: #fff;

  @font-face { font-family: 'PangMenZhengDao'; src: url('@/assets/fonts/PangMenZhengDao.ttf'); }

  .header-box {
    width: 100%; height: 80px;
    background-image: url('@/assets/images/head_bg.png');
    background-size: 3000px 100%; background-repeat: no-repeat; background-position: center;
    display: flex; align-items: center; justify-content: center;
    font-family: 'PangMenZhengDao'; font-size: 40px; letter-spacing: 2px; position: relative;

    span {
      background-image: linear-gradient(to bottom, rgb(232,239,251), rgb(179,205,252));
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .back-btn {
      position: absolute; right: 20px; top: 20px; padding: 6px 14px; font-size: 14px;
      background: rgba(0,203,255,.2); border: 1px solid #00cbff; color:#fff; border-radius: 4px; cursor: pointer;
    }
  }

  .smart-content {
    margin-top: 30px; width: 100%; height: calc(100% - 60px); display: flex;
    .s-c-left { width: 25%; height: 100%; padding: 20px; box-sizing: border-box; }
    .s-c-center {
      width: 75%; height: 93%; padding: 20px; box-sizing: border-box;
      background-image: url('@/assets/images/center_bg.png');
      background-size: 100% 900px; background-repeat: no-repeat; background-position: center;
    }
  }
}
</style>
