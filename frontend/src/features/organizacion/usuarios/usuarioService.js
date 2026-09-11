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

/**
 * POST /api/Usuarios responde CreateUsuarioResult ({ id, passwordGenerada }),
 * no el UsuarioDto. En mock no se guarda la clave en el registro.
 */
export async function create(data) {
  const payload = {
    idsEmpresas: data.idsEmpresas ?? [],
    nombres: data.nombres,
    apellidos: data.apellidos,
    correo: data.correo,
    username: data.username,
    password: data.password,
    rol: Number(data.rol),
    generarPassword: false,
  };

  if (env.useApiMock) {
    const idsEmpresas = (payload.idsEmpresas ?? []).map(Number);
    const created = await crud.create({
      idsEmpresas,
      idEmpresa: idsEmpresas.length > 0 ? idsEmpresas[0] : null,
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
      passwordGenerada: null,
    };
  }

  const response = await httpClient.post(apiPaths.usuarios, payload);
  return {
    id: Number(response.data?.id),
    passwordGenerada: response.data?.passwordGenerada ?? null,
  };
}

/** GET /api/Usuarios exige EscrituraEmpresa. Operador sin permiso de escritura recibe 403. */
export const USUARIOS_SIN_LECTURA =
  'Tu perfil no puede listar usuarios. Pedí un administrador de empresa.';

const SIN_USUARIOS = Object.freeze([]);

export function getAllIfAllowed(canRead) {
  if (!canRead) {
    return Promise.resolve(SIN_USUARIOS);
  }
  return getAll();
}
