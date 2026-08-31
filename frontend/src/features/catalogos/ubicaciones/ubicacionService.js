import { ubicaciones } from '@/features/catalogos/mocks/ubicaciones';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/ubicaciones',
  seed: ubicaciones,
});
