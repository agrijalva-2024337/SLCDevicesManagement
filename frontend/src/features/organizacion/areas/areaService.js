import { areas } from '@/features/organizacion/mocks/areas';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/areas',
  seed: areas,
});
