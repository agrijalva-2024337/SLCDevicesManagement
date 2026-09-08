import * as activoService from '@/features/activos/activoService';
import * as historialActivoService from '@/features/activos/historialActivoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { ESTADO_ACTIVO, TIPO_ASIGNACION, getIdEstado, getIdTipoAsignacion } from '@/shared/api/tipoAsignacion';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';

function idFromCreated(response, fallback) {
  const data = response?.data;
  if (typeof data === 'object' && data?.id != null) return Number(data.id);
  const n = Number(data);
  return Number.isFinite(n) ? n : fallback;
}

export async function listar() {
  const idTipo = await getIdTipoAsignacion(TIPO_ASIGNACION.Mantenimiento);
  const rows = await asignacionService.getAll();
  return (rows ?? []).filter((row) => Number(row.idTipoAsignacion) === Number(idTipo));
}

export async function getById(id) {
  return asignacionService.getById(id);
}

export function estaAbierto(row) {
  return Boolean(row?.activa) && !row?.fechaDevolucion;
}

async function persistirApertura(command) {
  if (env.useApiMock) {
    const activo = await activoService.getById(command.idActivo);
    return asignacionService.create({
      idActivo: command.idActivo,
      idUsuario: command.idUsuario,
      idResponsable: command.idResponsable,
      idEstado: command.idEstado,
      idTipoAsignacion: await getIdTipoAsignacion(TIPO_ASIGNACION.Mantenimiento),
      fechaAsignacion: command.fechaAsignacion,
      fechaDevolucion: null,
      activa: true,
      observaciones: command.observaciones,
      documentoPdfUrl: null,
      idUbicacion: activo.idUbicacion,
    });
  }

  try {
    const response = await httpClient.post(`${apiPaths.asignaciones}/mantenimiento`, command);
    return { id: idFromCreated(response, null), ...command };
  } catch (error) {
    throw applyApiFieldErrors(error);
  }
}

async function aplicarAperturaMock({ activo, idAsignacion, idTipoMantenimiento, descripcionProblema }) {
  if (!env.useApiMock) return;
  const idEstado = await getIdEstado(ESTADO_ACTIVO.EnMantenimiento);
  await activoService.update(activo.id, { idEstado });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Mantenimiento',
    descripcion: 'Inicio de mantenimiento',
    informacionAnterior: null,
    informacionNueva: `id_tipo_mantenimiento=${idTipoMantenimiento}; descripcion_problema=${descripcionProblema}`,
  });
}

function asFechaAsignacion(fecha) {
  const raw = String(fecha ?? '').trim();
  if (!raw) return new Date().toISOString();
  if (raw.includes('T')) return raw;
  return `${raw}T12:00:00.000Z`;
}

export async function registrar({
  idActivo,
  idUsuario,
  idResponsable,
  fecha,
  observaciones,
  idTipoMantenimiento,
  descripcionProblema,
}) {
  const userId = Number(idUsuario);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('No se pudo identificar al usuario de la sesión. Vuelva a iniciar sesión.');
  }

  const tipoId = Number(idTipoMantenimiento);
  if (!Number.isFinite(tipoId) || tipoId <= 0) {
    const error = new Error('Seleccione un tipo de mantenimiento.');
    error.fieldErrors = { idTipoMantenimiento: 'Seleccione un tipo de mantenimiento.' };
    throw error;
  }

  const idEstado = await getIdEstado(ESTADO_ACTIVO.EnMantenimiento);
  const activo = await activoService.getById(idActivo);
  const problema = String(descripcionProblema ?? '').trim();

  const created = await persistirApertura({
    idActivo: Number(idActivo),
    idUsuario: userId,
    idResponsable: Number(idResponsable),
    idEstado,
    idTipoMantenimiento: tipoId,
    descripcionProblema: problema,
    fechaAsignacion: asFechaAsignacion(fecha),
    observaciones: String(observaciones ?? '').trim() || null,
  });

  await aplicarAperturaMock({
    activo,
    idAsignacion: created.id,
    idTipoMantenimiento: Number(idTipoMantenimiento),
    descripcionProblema: problema,
  });
  return created;
}

async function aplicarCierreMock({ activo, idAsignacion, fechaDevolucion }) {
  if (!env.useApiMock) return;
  const idEstado = await getIdEstado(ESTADO_ACTIVO.Disponible);
  await activoService.update(activo.id, { idEstado });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Modificacion',
    descripcion: 'Cierre de mantenimiento',
    informacionAnterior: 'activa=true',
    informacionNueva: `activa=false; fecha_devolucion=${fechaDevolucion}`,
  });
}

export async function finalizar(
  id,
  { trabajoRealizado, costo, numeroFactura, fechaDevolucion, observaciones } = {},
) {
  const numericId = Number(id);
  const row = await asignacionService.getById(numericId);
  const cierre = fechaDevolucion || new Date().toISOString();
  const command = {
    id: numericId,
    trabajoRealizado: String(trabajoRealizado ?? '').trim() || null,
    costo: costo === '' || costo == null ? null : Number(costo),
    numeroFactura: String(numeroFactura ?? '').trim() || null,
    fechaDevolucion: cierre,
    observaciones: String(observaciones ?? '').trim() || null,
  };

  if (env.useApiMock) {
    const updated = await asignacionService.devolver(numericId, {
      fechaDevolucion: cierre,
      observaciones: command.observaciones ?? row.observaciones,
    });
    const activo = await activoService.getById(row.idActivo);
    await aplicarCierreMock({ activo, idAsignacion: numericId, fechaDevolucion: cierre });
    return updated;
  }

  try {
    await httpClient.post(`${apiPaths.asignaciones}/${numericId}/finalizar-mantenimiento`, command);
  } catch (error) {
    throw applyApiFieldErrors(error);
  }

  return { id: numericId, ...command };
}
