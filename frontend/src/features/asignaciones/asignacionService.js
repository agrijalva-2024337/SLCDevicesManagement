import { env } from '@/shared/config/env';
import { asignaciones } from '@/features/asignaciones/mocks/asignaciones';
import { apiPaths } from '@/shared/api/paths';
import httpClient from '@/shared/services/httpClient';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.asignaciones,
  seed: asignaciones,
});

export const { getAll, getById, create, update, remove } = crud;

export async function devolver(id, data = {}) {
  const numericId = Number(id);
  const fechaDevolucion = data.fechaDevolucion || new Date().toISOString();
  const patch = {
    activa: false,
    fechaDevolucion,
    observaciones: data.observaciones,
  };

  if (env.useApiMock) {
    const current = await crud.getById(numericId);
    return crud.update(numericId, {
      ...patch,
      observaciones: data.observaciones ?? current.observaciones,
    });
  }

  await httpClient.post(`${apiPaths.asignaciones}/${numericId}/devolver`, {
    id: numericId,
    fechaDevolucion,
    observaciones: data.observaciones ?? null,
  });
  return { id: numericId, ...patch };
}
