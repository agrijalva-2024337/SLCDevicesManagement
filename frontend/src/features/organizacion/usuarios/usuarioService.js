import { usuarios } from '@/features/organizacion/mocks/usuarios';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
import httpClient from '@/shared/services/httpClient';

const crud = createMockCrudService({
  endpoint: apiPaths.usuarios,
  seed: usuarios,
});

export const { getAll, getById, update, remove } = crud;

function mockGeneratedPassword() {
  return `SLC-${Math.random().toString(36).slice(2, 10)}A1`;
}

/**
 * POST /api/Usuarios responde CreateUsuarioResult ({ id, passwordGenerada }),
 * no el UsuarioDto. En mock no se guarda la clave en el registro.
 */
export async function create(data) {
  const generarPassword = Boolean(data.generarPassword);
  const payload = {
    idEmpresa: data.idEmpresa ?? null,
    nombres: data.nombres,
    apellidos: data.apellidos,
    correo: data.correo,
    username: data.username,
    password: generarPassword ? null : data.password,
    rol: Number(data.rol),
    generarPassword,
  };

  if (env.useApiMock) {
    const created = await crud.create({
      idEmpresa: payload.idEmpresa,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      correo: payload.correo,
      username: payload.username,
      rol: payload.rol,
      habilitado: true,
      fechaCreacion: new Date().toISOString(),
    });
    return {
      ...created,
      passwordGenerada: generarPassword ? mockGeneratedPassword() : null,
    };
  }

  const response = await httpClient.post(apiPaths.usuarios, payload);
  return {
    id: Number(response.data?.id),
    passwordGenerada: response.data?.passwordGenerada ?? null,
  };
}

/** GET /api/Usuarios exige EscrituraEmpresa. Consulta y Operador reciben 403. */
export const USUARIOS_SIN_LECTURA =
  'Tu perfil no puede listar usuarios. Pedí un administrador de empresa.';

export function getAllIfAllowed(canRead) {
  if (!canRead) {
    return Promise.resolve([]);
  }
  return getAll();
}
