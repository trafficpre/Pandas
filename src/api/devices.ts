import http from './http'

export interface DeviceItem {
  rod_id: number
  device_type?: string
  longitude?: number
  latitude?: number
  battery_soc?: number | null
  status: '正常' | '低电' | '异常' | '离线'
  last_seen?: string | null
}
export interface DeviceListResp {
  total: number
  items: DeviceItem[]
}

export function fetchDevices(params: {
  page?: number
  page_size?: number
  search?: string
}) {
  return http.get<DeviceListResp>('/api/devices', { params })
}
