import { historicosInventario } from '@/features/inventario/mocks/historicosInventario';
import { TIPO_DIFERENCIA } from '@/features/inventario/tipoDiferencia';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
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

export async function crear(payload) {
  const command = {
    idSede: Number(payload.idSede),
    responsable: String(payload.responsable ?? '').trim() || null,
    fechaInicio: payload.fechaInicio,
    observaciones: String(payload.observaciones ?? '').trim() || null,
  };

  if (env.useApiMock) {
    const abiertas = await crud.getAll({ idSede: command.idSede });
    if (abiertas.some((row) => !row.cerrado)) {
      const error = new Error('Ya existe una jornada de inventario abierta para esta sede.');
      error.status = 400;
      error.fieldErrors = { idSede: error.message };
      throw error;
    }
    return crud.create({
      ...command,
      cerrado: false,
      fechaCierre: null,
    });
  }

  try {
    const response = await httpClient.post(apiPaths.historicosInventario, command);
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
  const detalles = await listarPorJornada(jornada.id);
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
