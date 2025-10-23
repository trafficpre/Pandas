// src/api/battery.ts
import http from './http'; // 如不是默认导出，请改为 { http } 或对应名称

export type DailyPoint = { date: string; battery_soc: number | null };

export async function apiListRods() {
  const { data } = await http.get<{ rods: number[] }>('/api/battery/rods');
  return data.rods || [];
}

export async function apiBatteryDaily(params: {
  rod_id: number;
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
  fill?: boolean;
}) {
  const { rod_id, start, end, fill = true } = params;
  const { data } = await http.get<{
    rod_id: number;
    start: string;
    end: string;
    points: DailyPoint[];
  }>('/api/battery/daily', {
    params: {
      rod_id,
      start,
      end,
      fill: fill ? 'true' : 'false',
    },
  });
  return data;
}
