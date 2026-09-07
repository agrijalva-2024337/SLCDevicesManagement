import { usuarios } from '@/features/organizacion/mocks/usuarios';
import { apiPaths } from '@/shared/api/paths';
import { createMockCrudService } from '@/shared/services/createMockCrudService';

export const { getAll, getById, create, update, remove } = createMockCrudService({
  endpoint: apiPaths.usuarios,
  seed: usuarios,
});

/** GET /api/Usuarios exige EscrituraEmpresa. Consulta y Operador reciben 403. */
export const USUARIOS_SIN_LECTURA =
  'Tu perfil no puede listar usuarios. Pedí un administrador de empresa.';

export function getAllIfAllowed(canRead) {
  if (!canRead) {
    return Promise.resolve([]);
  }
  return getAll();
}
