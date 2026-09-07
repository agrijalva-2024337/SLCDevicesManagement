import { normalizeBssid } from '@/features/catalogos/redesConocidas/bssid';
import { BSSID_DUPLICADO } from '@/features/catalogos/redesConocidas/redConocidaErrors';
import { redesConocidas } from '@/features/catalogos/redesConocidas/mocks/redesConocidas';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

const crud = createMockCrudService({
  endpoint: apiPaths.redesConocidas,
  seed: redesConocidas,
});

function duplicateError() {
  const error = new Error(BSSID_DUPLICADO);
  error.status = 409;
  error.fieldErrors = { bssid: BSSID_DUPLICADO };
  return error;
}

async function assertBssidLibre(data, currentId) {
  if (!env.useApiMock) return;
  const needle = normalizeBssid(data?.bssid);
  const rows = await crud.getAll();
  const clash = rows.some(
    (row) => normalizeBssid(row.bssid) === needle && Number(row.id) !== Number(currentId),
  );
  if (clash) throw duplicateError();
}

export const { getAll, getById, remove } = crud;

export async function create(data) {
  await assertBssidLibre(data);
  return crud.create({ ...data, bssid: normalizeBssid(data.bssid) });
}

export async function update(id, data) {
  await assertBssidLibre(data, id);
  return crud.update(id, { ...data, bssid: normalizeBssid(data.bssid) });
}
