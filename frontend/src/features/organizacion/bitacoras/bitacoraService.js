import { bitacoras } from '@/features/organizacion/mocks/bitacoras';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';

const MOCK_DELAY_MS = 400;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let items = clone(bitacoras);

function matchesQuery(row, { idUsuario, entidadAfectada } = {}) {
  if (idUsuario != null && idUsuario !== '' && Number(row.idUsuario) !== Number(idUsuario)) {
    return false;
  }
  if (entidadAfectada && row.entidadAfectada !== entidadAfectada) {
    return false;
  }
  return true;
}

function queryParams({ idUsuario, entidadAfectada } = {}) {
  const params = {};
  if (idUsuario != null && idUsuario !== '') {
    params.idUsuario = Number(idUsuario);
  }
  if (entidadAfectada) {
    params.entidadAfectada = entidadAfectada;
  }
  return params;
}

export async function getAll(params = {}) {
  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);
    return clone(items).filter((row) => matchesQuery(row, params));
  }

  // [API] GET /api/Bitacoras solo acepta idUsuario y entidadAfectada.
  // No hay paginación ni filtro por fecha/tipo: esos se aplican en cliente.
  const response = await httpClient.get(apiPaths.bitacoras, { params: queryParams(params) });
  return response.data;
}

export async function getById(id) {
  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);
    const found = items.find((item) => item.id === Number(id));
    if (!found) {
      const error = new Error('No se encontró el registro solicitado.');
      error.status = 404;
      throw error;
    }
    return clone(found);
  }

  const response = await httpClient.get(`${apiPaths.bitacoras}/${id}`);
  return response.data;
}
