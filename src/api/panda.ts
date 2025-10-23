// src/api/panda.ts
import http from './http';

export type PandaMonthlyItem = { month: string; count: number };

export async function apiPandaMonthly(params: {
  rod_id: number;
  start_month: string; // 'YYYY-MM'
  end_month: string;   // 'YYYY-MM'
  fill?: boolean;      // 默认 true
}) {
  const { rod_id, start_month, end_month, fill = true } = params;
  const { data } = await http.get<{
    rod_id: number;
    start_month: string;
    end_month: string;
    points: PandaMonthlyItem[];
  }>('/api/panda/monthly', {
    params: {
      rod_id,
      start_month,
      end_month,
      fill: fill ? 'true' : 'false',
    },
  });
  return data;
}
