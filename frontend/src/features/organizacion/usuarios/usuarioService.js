import { usuarios } from '@/features/organizacion/mocks/usuarios';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
import httpClient from '@/shared/services/httpClient';

const crud = createMockCrudService({
  endpoint: apiPaths.usuarios,
  seed: usuarios,
});

export const { getById, update, remove } = crud;

export async function getAll(params) {
  const idEmpresa = params?.idEmpresa;
  const rest = { ...params };
  delete rest.idEmpresa;

  if (env.useApiMock) {
    const rows = await crud.getAll(Object.keys(rest).length > 0 ? rest : undefined);
    if (idEmpresa == null || idEmpresa === '') return rows;
    const wanted = Number(idEmpresa);
    return (rows ?? []).filter((usuario) => {
      const ids = usuario.idsEmpresas ?? usuario.empresasAutorizadas ?? [];
      if (ids.length > 0) return ids.map(Number).includes(wanted);
      return usuario.idEmpresa != null && Number(usuario.idEmpresa) === wanted;
    });
  }

  const query = { ...rest };
  if (idEmpresa != null && idEmpresa !== '') {
    query.idEmpresa = Number(idEmpresa);
  }
  return crud.getAll(Object.keys(query).length > 0 ? query : undefined);
}

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

/** GET /api/Usuarios exige EscrituraEmpresa (admin empresa o admin general). */
export const USUARIOS_SIN_LECTURA =
  'Tu perfil no puede listar usuarios. Pedí un administrador de empresa.';

const SIN_USUARIOS = Object.freeze([]);

export function getAllIfAllowed(canRead, params) {
  if (!canRead) {
    return Promise.resolve(SIN_USUARIOS);
  }
  return getAll(params);
}
