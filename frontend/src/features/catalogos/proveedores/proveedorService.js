import { proveedores } from '@/features/catalogos/mocks/proveedores';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: '/api/proveedores',
  seed: proveedores,
});
