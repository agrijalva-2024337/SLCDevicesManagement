import * as activoService from '@/features/activos/activoService';
import * as historialActivoService from '@/features/activos/historialActivoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { ESTADO_ACTIVO, TIPO_ASIGNACION, getIdEstado, getIdTipoAsignacion } from '@/shared/api/tipoAsignacion';
import { env } from '@/shared/config/env';

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

/**
 * Punto de conexión BE-17.
 * Hoy: POST /api/Asignaciones (CreateAsignacionCommand ya pone Estado = En mantenimiento).
 * Cuando exista POST /api/Asignaciones/mantenimiento, cambiar solo persistirApertura.
 */
async function persistirApertura(payload) {
  return asignacionService.create(payload);
}

async function aplicarAperturaMock({ activo, idAsignacion }) {
  if (!env.useApiMock) return;
  const idEstado = await getIdEstado(ESTADO_ACTIVO.EnMantenimiento);
  await activoService.update(activo.id, { idEstado });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Creacion',
    descripcion: 'Apertura de mantenimiento',
    informacionAnterior: null,
    informacionNueva: `Activo ${activo.id} en mantenimiento.`,
  });
}

export async function registrar({ idActivo, idUsuario, idResponsable, fecha, observaciones }) {
  const idTipoAsignacion = await getIdTipoAsignacion(TIPO_ASIGNACION.Mantenimiento);
  const idEstado = await getIdEstado(ESTADO_ACTIVO.EnMantenimiento);
  const activo = await activoService.getById(idActivo);

  const created = await persistirApertura({
    idActivo: Number(idActivo),
    idUsuario: Number(idUsuario),
    idResponsable: Number(idResponsable),
    idEstado,
    idTipoAsignacion,
    fechaAsignacion: fecha,
    fechaDevolucion: null,
    activa: true,
    observaciones: String(observaciones ?? '').trim() || null,
    documentoPdfUrl: null,
    idUbicacion: activo.idUbicacion,
  });

  await aplicarAperturaMock({ activo, idAsignacion: created.id });
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

/**
 * Punto de conexión BE-17: POST /api/Asignaciones/{id}/finalizar-mantenimiento.
 * Mientras tanto usa POST /api/Asignaciones/{id}/devolver (BE-15), que revierte a Disponible.
 */
export async function finalizar(id, { fechaDevolucion, observaciones } = {}) {
  const row = await asignacionService.getById(id);
  const cierre = fechaDevolucion || new Date().toISOString();
  const updated = await asignacionService.devolver(id, {
    fechaDevolucion: cierre,
    observaciones: observaciones ?? row.observaciones,
  });
  const activo = await activoService.getById(row.idActivo);
  await aplicarCierreMock({ activo, idAsignacion: Number(id), fechaDevolucion: cierre });
  return updated;
}
