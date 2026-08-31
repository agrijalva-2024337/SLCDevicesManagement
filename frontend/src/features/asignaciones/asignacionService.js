import { asignaciones } from '@/features/asignaciones/mocks/asignaciones';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: apiPaths.asignaciones,
  seed: asignaciones,
});
