import { rastreo } from '@/features/rastreo/mocks/rastreo';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function listarRastreo() {
  if (env.useApiMock) {
    await wait(400);
    return rastreo.filter((row) => !row.revocado).map((row) => ({ ...row }));
  }

  const response = await httpClient.get(apiPaths.dispositivos.rastreo);
  return response.data;
}

export function mapsUrlDe(ubicacion) {
  const lat = Number(ubicacion?.latitud);
  const lng = Number(ubicacion?.longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatHaceCuanto(value) {
  if (!value) return 'Sin señal';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'Sin señal';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `Hace ${days} d`;
}
