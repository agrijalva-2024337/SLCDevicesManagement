import { httpClient } from '@/core/http/client';
import type { HealthStatus } from '../types';

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await httpClient.get<HealthStatus>('/health');
  return data;
}
