import { historialActivos } from '@/features/activos/mocks/historialActivos';
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
