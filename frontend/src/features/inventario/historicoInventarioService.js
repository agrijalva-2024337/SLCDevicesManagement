import { historicosInventario } from '@/features/inventario/mocks/historicosInventario';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: apiPaths.historicosInventario,
  seed: historicosInventario,
});
