import { historicosInventario } from '@/features/inventario/mocks/historicosInventario';
import { TIPO_DIFERENCIA } from '@/features/inventario/tipoDiferencia';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
import { invalidateAfterMutation } from '@/shared/data/mutationInvalidation';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';

const crud = createMockCrudService({
  endpoint: apiPaths.historicosInventario,
  seed: historicosInventario,
});

function idFromCreated(response, fallback) {
  const data = response?.data;
  if (typeof data === 'object' && data?.id != null) return Number(data.id);
  const n = Number(data);
  return Number.isFinite(n) ? n : fallback;
}

export async function listar({ idSede, idEmpresa, soloAbiertos } = {}) {
  if (env.useApiMock) {
    let rows = await crud.getAll(idSede != null && idSede !== '' ? { idSede: Number(idSede) } : undefined);
    if (idEmpresa != null && idEmpresa !== '') {
      const { getAll: listarSedes } = await import('@/features/organizacion/sedes/sedeService');
      const sedes = await listarSedes();
      const wanted = Number(idEmpresa);
      const ids = new Set(
        (sedes ?? []).filter((sede) => Number(sede.idEmpresa) === wanted).map((sede) => Number(sede.id)),
      );
      rows = rows.filter((row) => ids.has(Number(row.idSede)));
    }
    if (soloAbiertos === true) rows = rows.filter((row) => !row.cerrado);
    if (soloAbiertos === false) rows = rows.filter((row) => row.cerrado);
    return rows;
  }

  const params = {};
  if (idSede != null && idSede !== '') params.idSede = Number(idSede);
  if (idEmpresa != null && idEmpresa !== '') params.idEmpresa = Number(idEmpresa);
  if (soloAbiertos === true || soloAbiertos === false) params.soloAbiertos = soloAbiertos;
  const response = await httpClient.get(apiPaths.historicosInventario, { params });
  return response.data;
}

export async function getById(id) {
  return crud.getById(id);
}

export async function listarResponsables({ idEmpresa } = {}) {
  if (env.useApiMock) {
    const { usuarios } = await import('@/features/organizacion/mocks/usuarios');
    const { RolUsuario } = await import('@/shared/api/contracts');
    return (usuarios ?? [])
      .filter(
        (usuario) =>
          usuario.habilitado !== false && Number(usuario.rol) === RolUsuario.OperadorInventario,
      )
      .filter((usuario) => {
        if (idEmpresa == null || idEmpresa === '') return true;
        const ids = usuario.idsEmpresas ?? usuario.empresasAutorizadas ?? [];
        return ids.map(Number).includes(Number(idEmpresa));
      })
      .map((usuario) => ({
        id: usuario.id,
        nombre: [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim(),
      }));
  }

  const params = {};
  if (idEmpresa != null && idEmpresa !== '') params.idEmpresa = Number(idEmpresa);
  const response = await httpClient.get(apiPaths.historicosInventarioResponsables, { params });
  return response.data;
}

function nombreSesion(usuario) {
  return [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(' ').trim() || usuario?.nombres || '';
}

export async function crear(payload) {
  const command = {
    idSede: Number(payload.idSede),
    fechaInicio: payload.fechaInicio,
    observaciones: String(payload.observaciones ?? '').trim() || null,
  };
  if (payload.idUsuario != null && payload.idUsuario !== '') {
    command.idUsuario = Number(payload.idUsuario);
  }

  if (env.useApiMock) {
    const { getSessionUser } = await import('@/shared/services/tokenStorage');
    const { RolUsuario } = await import('@/shared/api/contracts');
    const sesion = getSessionUser();
    const esOperador = Number(sesion?.rol) === RolUsuario.OperadorInventario;

    let responsableNombre = '';
    if (esOperador) {
      responsableNombre = nombreSesion(sesion);
    } else {
      const responsables = await listarResponsables();
      const elegido = responsables.find((row) => Number(row.id) === command.idUsuario);
      if (!elegido) {
        const error = new Error('Seleccione un usuario operador de inventario.');
        error.status = 400;
        error.fieldErrors = { idUsuario: error.message };
        throw error;
      }
      responsableNombre = elegido.nombre;
    }

    const abiertas = await crud.getAll({ idSede: command.idSede });
    if (abiertas.some((row) => !row.cerrado)) {
      const error = new Error('Ya existe una jornada de inventario abierta para esta sede.');
      error.status = 400;
      error.fieldErrors = { idSede: error.message };
      throw error;
    }
    return crud.create({
      idSede: command.idSede,
      responsable: responsableNombre,
      fechaInicio: command.fechaInicio,
      observaciones: command.observaciones,
      cerrado: false,
      fechaCierre: null,
    });
  }

  try {
    const response = await httpClient.post(apiPaths.historicosInventario, command);
    invalidateAfterMutation('historicosInventario');
    return { id: idFromCreated(response, null), ...command, cerrado: false, fechaCierre: null };
  } catch (error) {
    const next = applyApiFieldErrors(error);
    if (String(next.message ?? '').includes('jornada de inventario abierta')) {
      next.fieldErrors = { ...next.fieldErrors, idSede: next.message };
    }
    throw next;
  }
}

export async function cerrar(id, fechaCierre) {
  const numericId = Number(id);

  if (env.useApiMock) {
    const current = await crud.getById(numericId);
    if (current.cerrado) {
      const error = new Error('La jornada de inventario ya esta cerrada.');
      error.status = 409;
      throw error;
    }
    return crud.update(numericId, {
      cerrado: true,
      fechaCierre: fechaCierre || new Date().toISOString(),
    });
  }

  try {
    await httpClient.post(`${apiPaths.historicosInventario}/${numericId}/cerrar`, null, {
      params: fechaCierre ? { fechaCierre } : undefined,
    });
    invalidateAfterMutation('historicosInventario');
  } catch (error) {
    throw applyApiFieldErrors(error);
  }

  return { id: numericId, cerrado: true, fechaCierre: fechaCierre || new Date().toISOString() };
}

export async function diferencias(id) {
  if (!env.useApiMock) {
    const response = await httpClient.get(`${apiPaths.historicosInventario}/${id}/diferencias`);
    return response.data;
  }

  const jornada = await getById(id);
  const { listarPorJornada } = await import('@/features/inventario/detalleActivoService');
  const { idsEsperadosDeSede } = await import('@/features/inventario/activosEsperados');
  const detalles = await listarPorJornada(jornada.id);
  const idsEsperados = await idsEsperadosDeSede(jornada.idSede);
  const idsVerificados = new Set(detalles.map((item) => Number(item.idActivo)));
  const { getById: getActivo } = await import('@/features/activos/activoService');

  async function nombreDe(idActivo) {
    try {
      const activo = await getActivo(idActivo);
      return activo?.nombre ?? '(activo no encontrado)';
    } catch {
      return '(activo no encontrado)';
    }
  }

  const resultado = [];
  for (const idActivo of idsEsperados.filter((item) => !idsVerificados.has(Number(item)))) {
    resultado.push({
      idActivo,
      nombreActivo: await nombreDe(idActivo),
      tipoDiferencia: TIPO_DIFERENCIA.Faltante,
      observaciones: 'No se registro verificacion para este activo en la jornada.',
    });
  }
  for (const detalle of detalles.filter((item) => !item.encontrado)) {
    resultado.push({
      idActivo: detalle.idActivo,
      nombreActivo: await nombreDe(detalle.idActivo),
      tipoDiferencia: TIPO_DIFERENCIA.NoEncontrado,
      observaciones: detalle.observaciones,
    });
  }
  for (const detalle of detalles.filter((item) => item.encontrado && !item.buenEstado)) {
    resultado.push({
      idActivo: detalle.idActivo,
      nombreActivo: await nombreDe(detalle.idActivo),
      tipoDiferencia: TIPO_DIFERENCIA.MalEstado,
      observaciones: detalle.observaciones,
    });
  }
  return resultado;
}
