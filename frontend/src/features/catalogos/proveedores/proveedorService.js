import { proveedores } from '@/features/catalogos/mocks/proveedores';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.proveedores,
  seed: proveedores,
});

function fromApi(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const { corre, correo, ...rest } = item;
  return { ...rest, correo: correo ?? corre ?? null };
}

function toApi(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const { correo, corre, ...rest } = data;
  return { ...rest, corre: correo ?? corre ?? null };
}

export async function getAll(params) {
  const rows = await crud.getAll(params);
  return Array.isArray(rows) ? rows.map(fromApi) : rows;
}

export async function getById(id) {
  return fromApi(await crud.getById(id));
}

export async function create(data) {
  const saved = await crud.create(toApi(data));
  return fromApi(saved);
}

export async function update(id, data) {
  const saved = await crud.update(id, toApi(data));
  return fromApi(saved);
}

export const { remove } = crud;
