import { estados } from '@/features/organizacion/mocks/estados';
import { apiPaths } from '@/shared/api/paths';
import {
  enrichWithEmpresaScope,
  forgetCatalogEmpresa,
  rememberCatalogEmpresa,
} from '@/shared/data/empresaCatalogScope';
import { registerLoaderKey } from '@/shared/data/loaderKeys';
import { listQueryKey } from '@/shared/data/queryKeys';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.estados,
  seed: estados,
});

const RESOURCE = 'estados';

export async function getAll(params, options) {
  return enrichWithEmpresaScope(RESOURCE, await crud.getAll(params, options));
}

registerLoaderKey(getAll, listQueryKey(RESOURCE, {}));

export async function getById(id, options) {
  const row = await crud.getById(id, options);
  return enrichWithEmpresaScope(RESOURCE, [row])[0];
}

export async function create(data) {
  const created = await crud.create(data);
  rememberCatalogEmpresa(RESOURCE, created.id, data?.idEmpresa ?? created.idEmpresa);
  return { ...created, idEmpresa: data?.idEmpresa ?? created.idEmpresa };
}

export async function update(id, data) {
  const updated = await crud.update(id, data);
  if (data?.idEmpresa != null && data.idEmpresa !== '') {
    rememberCatalogEmpresa(RESOURCE, updated.id ?? id, data.idEmpresa);
  }
  return enrichWithEmpresaScope(RESOURCE, [updated])[0];
}

export async function remove(id) {
  const result = await crud.remove(id);
  forgetCatalogEmpresa(RESOURCE, id);
  return result;
}
