import { empresas } from '@/features/organizacion/mocks/empresas';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/empresas',
  seed: empresas,
});
