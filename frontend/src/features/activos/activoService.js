import { activos } from '@/features/activos/mocks/activos';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.activos,
  seed: activos,
});

export const { getAll, getById, update, remove } = crud;

function tokenPara(id) {
  return `slc-act-${String(id).padStart(3, '0')}`;
}

export async function create(data) {
  const created = await crud.create(data);
  if (!env.useApiMock || created.tokenConsulta) return created;
  return crud.update(created.id, { tokenConsulta: tokenPara(created.id) });
}

/**
 * Resuelve lo que sale de un QR o de una búsqueda escrita. Acepta el token de
 * consulta, el número de serie o el id, porque las etiquetas viejas del parque
 * traen la serie impresa en vez del token.
 */
export async function buscarPorCodigo(codigo) {
  const needle = String(codigo ?? '').trim();
  if (!needle) return null;

  const lista = await getAll();
  const igual = (value) => String(value ?? '').trim().toLowerCase() === needle.toLowerCase();

  return (
    (lista ?? []).find((row) => igual(row.tokenConsulta)) ??
    (lista ?? []).find((row) => igual(row.numeroSerie)) ??
    (lista ?? []).find((row) => igual(row.id)) ??
    null
  );
}
