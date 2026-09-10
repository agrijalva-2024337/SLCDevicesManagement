import { paises } from '@/features/catalogos/mocks/paises';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove, hardRemove } = createMockCrudService({
  endpoint: apiPaths.paises,
  seed: paises,
});
