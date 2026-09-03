import { historialActivos } from '@/features/activos/mocks/historialActivos';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
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

export async function listarPorActivo(idActivo) {
  const [historial, asignaciones] = await Promise.all([getAll(), asignacionService.getAll()]);
  const ids = new Set(
    (asignaciones ?? [])
      .filter((row) => Number(row.idActivo) === Number(idActivo))
      .map((row) => Number(row.id)),
  );
  return (historial ?? [])
    .filter((item) => ids.has(Number(item.idAsignacion)))
    .sort((left, right) => new Date(right.fechaHora) - new Date(left.fechaHora));
}
