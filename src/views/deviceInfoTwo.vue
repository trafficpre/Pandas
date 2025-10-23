<template>
  <div class="device-info-two-wrapper">
    <div class="card-title">
      <span class="tit">设备基础信息</span>
      <span class="sub-tit">Basic Equipment Information</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="">
    </div>

    <div class="search-box">
      <input type="text" placeholder="请输入杯件 ID 进行搜索" />
    </div>

    <div class="device-table">
      <div class="table-header">
        <div class="col device-id">设备ID</div>
        <div class="col config">配置</div>
        <div class="col power">电量</div>
        <div class="col status">状态</div>
        <div class="col status">视频</div>
      </div>
      <div class="table-body">
        <div class="table-row">
          <div class="col device-id">rod001</div>
          <div class="col config">增强型设备</div>
          <div class="col power">92%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod001')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod002</div>
          <div class="col config">轻量化设备</div>
          <div class="col power">75%</div>
          <div class="col status disconnected">自组网断连</div>
          <div class="col status video" @click="openVideoModal('rod002')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod003</div>
          <div class="col config">标准型设备</div>
          <div class="col power">88%</div>
          <div class="col status camera-error">摄像头无画面</div>
          <div class="col status video" @click="openVideoModal('rod003')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod004</div>
          <div class="col config">轻量化设备</div>
          <div class="col power">60%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod004')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod005</div>
          <div class="col config">标准型设备</div>
          <div class="col power">30%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod005')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod006</div>
          <div class="col config">标准型设备</div>
          <div class="col power">52%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod006')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">r     od007</div>
          <div class="col config">标准型设备</div>
          <div class="col power">45%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod007')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod008</div>
          <div class="col config">轻量化设备</div>
          <div class="col power">96%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod008')">播放视频</div>
        </div>
        <div class="table-row">
          <div class="col device-id">rod009</div>
          <div class="col config">增强型设备</div>
          <div class="col power">63%</div>
          <div class="col status normal">正常</div>
          <div class="col status video" @click="openVideoModal('rod009')">播放视频</div>
        </div>
      </div>
      <div class="custom-scrollbar">
        <div class="scrollbar-thumb"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';

const emit = defineEmits(['openVideo']);

// 打开视频弹窗 - 通过emit事件传递给父组件
const openVideoModal = (deviceId: string) => {
  emit('openVideo', deviceId);
};
</script>

<style lang="scss">
.device-info-two-wrapper {
  width: 100%;
  height: 90%;
  background-image: url('@/assets/images/card_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 20px;
  box-sizing: border-box;
  color: #fff;
  position: relative;

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
      width: 98%;
      height: 20px;
      background-image: url('@/assets/images/line_bg.png');
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: center;
    }

    .tit {
      color: rgb(183, 207, 252);
    }

    .sub-tit {
      font-size: 14px;
      margin-left: 14px;
      color: #4e5e72;
    }

    .card-xz {
      width: 91px;
      height: 9px;
    }
  }

  .search-box {
    width: 90%;
    margin-top: 30px;
    margin-bottom: 20px;

    input {
      width: 100%;
      background-color: rgba(11, 27, 43, 0.8);
      border: 1px solid #1e3146;
      border-radius: 4px;
      height: 40px;
      color: #fff;
      font-size: 16px;
      padding: 0 15px;
      outline: none;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .device-table {
    width: 100%;
    position: relative;
    height: calc(100% - 120px);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    background-color: rgba(8, 19, 31, 0.8);
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    color: #00cbff;
    border-bottom: 1px solid #1e3146;
    padding-right: 8px;
    /* 滚动条宽度 */
  }

  .table-body {
    height: calc(100% - 40px);
    overflow-y: auto;
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;

    /* IE and Edge */
    &::-webkit-scrollbar {
      display: none;
      /* Chrome, Safari, Opera */
    }
  }

  .table-row {
    display: flex;
    height: 40px;
    line-height: 40px;
    border-bottom: 1px solid rgba(30, 49, 70, 0.5);
    font-size: 16px;
    transition: background-color 0.2s;

    &:nth-child(odd) {
      background-color: rgba(11, 27, 43, 0.4);
    }

    &:nth-child(even) {
      background-color: rgba(11, 27, 43, 0.2);
    }

    &:hover {
      background-color: rgba(30, 49, 70, 0.5);
    }
  }

  .col {
    padding: 0 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;

    &.device-id {
      width: 25%;
      color: #00cbff;
      text-align: left;
    }

    &.config {
      width: 25%;
      color: #f3bc42;
      text-align: left;
    }

    &.power {
      width: 25%;
      color: #00cbff;
      text-align: center;
    }

    &.status {
      width: 25%;
      text-align: center;

      &.normal {
        color: #00ff7f;
      }

      &.video {
        color: #ff4d4f;
        cursor: pointer;
      }

      &.disconnected {
        color: #ff4d4f;
      }

      &.camera-error {
        color: #ff4d4f;
      }
    }
  }

  .custom-scrollbar {
    position: absolute;
    right: 0;
    top: 40px;
    width: 8px;
    height: calc(100% - 40px);
    background-color: rgba(11, 27, 43, 0.5);

    .scrollbar-thumb {
      position: relative;
      width: 100%;
      height: 20%;
      background-color: rgba(30, 49, 70, 0.8);
      border-radius: 4px;
    }
  }
}
</style>