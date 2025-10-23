<template>
  <div class="device-info-wrapper">
    <div class="card-title">
      <span class="tit">设备基础信息</span>
      <span class="sub-tit">Basic Equipment Information</span>
      <img class="card-xz" src="@/assets/images/card_xz.png" alt="">
    </div>

    <div class="search-box">
      <input
        type="text"
        v-model="search"
        placeholder="请输入杯件 ID 进行搜索"
        @keyup.enter="onSearch"
      />
    </div>

    <div class="device-table">
      <div class="table-header">
        <div class="col device-id">设备ID</div>
        <div class="col config">配置</div>
        <div class="col power">电量</div>
        <div class="col status">状态</div>
      </div>
      <div class="table-body">
        <!-- 用接口数据渲染行 -->
        <div class="table-row" v-for="it in items" :key="it.rod_id">
          <div class="col device-id">{{ it.rod_id }}</div>
          <div class="col config">{{ it.device_type || '—' }}</div>
          <div class="col power">{{ fmtPercent(it.battery_soc) }}</div>
          <div class="col status" :class="statusClass(it.status)">{{ it.status }}</div>
        </div>
      </div>
      <div class="custom-scrollbar">
        <div class="scrollbar-thumb"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDevices, type DeviceItem } from '@/api/devices'

const loading = ref(false)
const search = ref('')
const items = ref<DeviceItem[]>([])

const pad = (n: number) => String(n).padStart(3, '0')
const fmtPercent = (v?: number | null) => (v == null ? '--' : `${Math.round(v)}%`)

// 把后端状态映射到你已有的样式类：normal / disconnected / camera-error
function statusClass(st: DeviceItem['status']) {
  return {
    normal: st === '正常',
    disconnected: st === '低电' || st === '离线',
    'camera-error': st === '异常',
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await fetchDevices({
      page: 1,
      page_size: 50,
      search: search.value?.trim() || undefined,
    })
    items.value = data.items
  } finally {
    loading.value = false
  }
}

function onSearch() {
  load()
}

onMounted(load)
</script>

<style lang="scss">
.device-info-wrapper {
  width: 100%;
  height: 45%;
  background-image: url('@/assets/images/card_l_t.png');
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
    width: 80%;
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
    width: 86%;
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
