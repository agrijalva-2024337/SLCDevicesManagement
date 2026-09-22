import { tiposMantenimiento } from '@/features/mantenimientos/mocks/tiposMantenimiento';
import { apiPaths } from '@/shared/api/paths';
import { registerLoaderKey } from '@/shared/data/loaderKeys';
import { listQueryKey, resourceFromEndpoint } from '@/shared/data/queryKeys';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.tiposMantenimiento,
  seed: tiposMantenimiento,
});

const RESOURCE = resourceFromEndpoint(apiPaths.tiposMantenimiento);

export const { getAll, getById, create, update, remove } = crud;

registerLoaderKey(getAll, listQueryKey(RESOURCE, {}));
