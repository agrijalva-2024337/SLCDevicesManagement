import { motivosBaja } from '@/features/bajas/mocks/motivosBaja';
import { apiPaths } from '@/shared/api/paths';
import { registerLoaderKey } from '@/shared/data/loaderKeys';
import { listQueryKey, resourceFromEndpoint } from '@/shared/data/queryKeys';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.motivosBaja,
  seed: motivosBaja,
});

const RESOURCE = resourceFromEndpoint(apiPaths.motivosBaja);

export const { getAll, getById, create, update, remove } = crud;

registerLoaderKey(getAll, listQueryKey(RESOURCE, {}));
