import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import { detallesActivo } from '@/features/inventario/mocks/detallesActivo';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
import { invalidateAfterMutation } from '@/shared/data/mutationInvalidation';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';

const crud = createMockCrudService({
  endpoint: apiPaths.detallesActivo,
  seed: detallesActivo,
});

function idFromCreated(response, fallback) {
  const data = response?.data;
  if (typeof data === 'object' && data?.id != null) return Number(data.id);
  const n = Number(data);
  return Number.isFinite(n) ? n : fallback;
}

function errorCerrada(message) {
  const error = new Error(message);
  error.status = message.includes('registrar') ? 400 : 409;
  return error;
}

async function assertJornadaAbierta(idHistoricoInventario, message) {
  const jornada = await historicoInventarioService.getById(idHistoricoInventario);
  if (jornada.cerrado) {
    throw errorCerrada(message);
  }
  return jornada;
}

export async function listarPorJornada(idHistoricoInventario) {
  return crud.getAll({ idHistoricoInventario: Number(idHistoricoInventario) });
}

export async function listarPorActivo(idActivo) {
  return crud.getAll({ idActivo: Number(idActivo) });
}

export async function getById(id) {
  return crud.getById(id);
}

export async function registrar(payload) {
  const command = {
    idActivo: Number(payload.idActivo),
    idHistoricoInventario: Number(payload.idHistoricoInventario),
    encontrado: Boolean(payload.encontrado),
    buenEstado: payload.encontrado ? Boolean(payload.buenEstado) : false,
    observaciones: String(payload.observaciones ?? '').trim() || null,
    fechaVerificacion: payload.fechaVerificacion || new Date().toISOString(),
  };

  if (env.useApiMock) {
    await assertJornadaAbierta(
      command.idHistoricoInventario,
      'La jornada de inventario ya esta cerrada. No se pueden registrar nuevos hallazgos.',
    );
    const existentes = await listarPorJornada(command.idHistoricoInventario);
    if (existentes.some((item) => Number(item.idActivo) === command.idActivo)) {
      const error = new Error('Este activo ya fue verificado en esta jornada de inventario.');
      error.status = 400;
      error.fieldErrors = { idActivo: error.message };
      throw error;
    }
    return crud.create(command);
  }

  try {
    const response = await httpClient.post(apiPaths.detallesActivo, command);
    invalidateAfterMutation('detallesActivo');
    return { id: idFromCreated(response, null), ...command };
  } catch (error) {
    throw applyApiFieldErrors(error);
  }
}

export async function actualizar(id, payload) {
  const numericId = Number(id);
  const command = {
    id: numericId,
    encontrado: Boolean(payload.encontrado),
    buenEstado: payload.encontrado ? Boolean(payload.buenEstado) : false,
    observaciones: String(payload.observaciones ?? '').trim() || null,
  };

  if (env.useApiMock) {
    const current = await crud.getById(numericId);
    await assertJornadaAbierta(
      current.idHistoricoInventario,
      'La jornada de inventario ya esta cerrada. No se puede editar el hallazgo.',
    );
    return crud.update(numericId, command);
  }

  try {
    await httpClient.put(`${apiPaths.detallesActivo}/${numericId}`, command);
    invalidateAfterMutation('detallesActivo');
  } catch (error) {
    throw applyApiFieldErrors(error);
  }

  return { ...command };
}

export async function eliminar(id) {
  const numericId = Number(id);

  if (env.useApiMock) {
    const current = await crud.getById(numericId);
    await assertJornadaAbierta(
      current.idHistoricoInventario,
      'La jornada de inventario ya esta cerrada. No se puede eliminar el hallazgo.',
    );
    return crud.remove(numericId);
  }

  try {
    await httpClient.delete(`${apiPaths.detallesActivo}/${numericId}`);
    invalidateAfterMutation('detallesActivo');
  } catch (error) {
    throw applyApiFieldErrors(error);
  }

  return { id: numericId };
}
