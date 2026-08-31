import { categorias } from '@/features/catalogos/mocks/categorias';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/categorias',
  seed: categorias,
});
