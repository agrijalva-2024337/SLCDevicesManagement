import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { delay } from '../mock/delay';

function matchesHealth(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url === '/health' || url.endsWith('/health');
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(400);

  if (matchesHealth(config)) {
    const response: AxiosResponse = {
      data: {
        status: 'ok',
        source: 'mock',
        message: 'Cliente Axios operativo (modo mock).',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };

    return response;
  }

  return Promise.reject(new Error(`No hay mock definido para ${config.method} ${config.url}`));
};
