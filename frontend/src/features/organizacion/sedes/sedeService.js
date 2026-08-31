import { sedes } from '@/features/organizacion/mocks/sedes';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/sedes',
  seed: sedes,
});
