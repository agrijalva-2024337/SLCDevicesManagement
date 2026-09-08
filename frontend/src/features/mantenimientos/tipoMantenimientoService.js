import { tiposMantenimiento } from '@/features/mantenimientos/mocks/tiposMantenimiento';
import { apiPaths } from '@/shared/api/paths';
import { createReadService } from '@/shared/services/createMockCrudService';

const read = createReadService({
  endpoint: apiPaths.tiposMantenimiento,
  seed: tiposMantenimiento,
});

export async function getAll(params) {
  const rows = await read.getAll(params);
  return Array.isArray(rows) ? rows : [];
}

export const { getById } = read;
