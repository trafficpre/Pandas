// src/api/rods.ts
import http from './http';

export async function apiRodIds() {
  const { data } = await http.get<{ rods: number[] }>('/api/battery/rods');
  return data.rods || [];
}
