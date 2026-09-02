import { env } from '@/shared/config/env';
import { apiPaths } from '@/shared/api/paths';
import httpClient from '@/shared/services/httpClient';

const MOCK_DELAY_MS = 500;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function checkApiHealth() {
  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);

    return {
      ok: true,
      source: 'mock',
      message: 'Cliente HTTP configurado. Respuesta simulada (VITE_USE_API_MOCK=true).',
    };
  }

  const response = await httpClient.get(apiPaths.health);
  const payload = response.data ?? {};
  const status = payload.status ?? 'Healthy';
  const service = payload.service ?? 'SLCDM.Api';

  return {
    ok: status === 'Healthy',
    source: 'api',
    status,
    timestamp: payload.timestamp,
    service,
    message: `${service}: ${status}`,
  };
}
