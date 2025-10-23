import http from './http'

export type UavFile = {
  name: string
  size: number
  sent: number
  sha256?: string
  status: 'queued' | 'transferring' | 'verified' | 'mismatch' | string
}

export type UavMission = {
  mission_id: string
  state: 'queued' | 'sending' | 'confirmed' | 'cleaned' | 'failed' | string
  updated_at?: string
  bytes: { total: number; sent: number }
  files: UavFile[]
}

export const getLatestMission = () =>
  http.get<UavMission>('/api/uav/missions/latest')

export const getMissions = (limit = 20) =>
  http.get<UavMission[]>(`/api/uav/missions?limit=${limit}`)

export const getMission = (mid: string) =>
  http.get<UavMission>(`/api/uav/missions/${encodeURIComponent(mid)}`)
