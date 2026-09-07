import { redesConocidas } from '@/features/catalogos/redesConocidas/mocks/redesConocidas';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: apiPaths.redesConocidas,
  seed: redesConocidas,
});
