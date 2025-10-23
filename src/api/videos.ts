// src/api/videos.ts
import http from './http'

export type VideoItem = {
  id: number
  rod_id: number
  video_filename: string
  video_path: string
  video_url: string        // 直接播放用
  longitude: number | null
  latitude: number | null
  created_at?: string | null
}

export type VideoListResp = {
  total: number
  page: number
  page_size: number
  items: VideoItem[]
}

export async function apiListVideos(params: {
  page: number
  page_size: number
  rod_id?: number
}) {
  const { data } = await http.get<VideoListResp>('/api/videos/', { params })
  return data
}
