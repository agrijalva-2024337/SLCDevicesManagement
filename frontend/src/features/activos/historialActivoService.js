import { historialActivos } from '@/features/activos/mocks/historialActivos';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { fetchQuery, getQueryData } from '@/shared/data/queryCache';
import { listQueryKey, ttlForKey } from '@/shared/data/queryKeys';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.historialActivos,
  seed: historialActivos,
});

export const { getAll, getById } = crud;

export async function registrarMovimientoMock(entry) {
  if (!env.useApiMock) return null;
  return crud.create(entry);
}

async function loadAsignaciones() {
  const key = listQueryKey('asignaciones');
  const cached = getQueryData(key);
  if (cached !== undefined) {
    return cached;
  }
  return fetchQuery(key, () => asignacionService.getAll(), { ttlMs: ttlForKey(key) });
}

export async function listarPorActivo(idActivo, asignaciones) {
  const [historial, rows] = await Promise.all([
    getAll(),
    asignaciones ? Promise.resolve(asignaciones) : loadAsignaciones(),
  ]);
  const ids = new Set(
    (rows ?? [])
      .filter((row) => Number(row.idActivo) === Number(idActivo))
      .map((row) => Number(row.id)),
  );
  return (historial ?? [])
    .filter((item) => ids.has(Number(item.idAsignacion)))
    .sort((left, right) => new Date(right.fechaHora) - new Date(left.fechaHora));
}
