import { paises } from '@/features/catalogos/mocks/paises';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/paises',
  seed: paises,
});
