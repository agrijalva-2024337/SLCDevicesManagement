import * as activoService from '@/features/activos/activoService';
import * as historialActivoService from '@/features/activos/historialActivoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import {
  formatTrasladoObservaciones,
  nombreUbicacion,
  parseTrasladoRuta,
} from '@/features/inventario/trasladoRuta';
import { ESTADO_ACTIVO, TIPO_ASIGNACION, getIdEstado, getIdTipoAsignacion } from '@/shared/api/tipoAsignacion';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { byId } from '@/shared/utils/format';
import { invalidateAfterMutation } from '@/shared/data/mutationInvalidation';
import httpClient from '@/shared/services/httpClient';

export { parseTrasladoRuta };

function idFromCreated(response, fallback) {
  const data = response?.data;
  if (typeof data === 'object' && data?.id != null) return Number(data.id);
  const n = Number(data);
  return Number.isFinite(n) ? n : fallback;
}

export function filtrarTraslados(rows, tipos) {
  return asignacionService.filtrarPorNombreTipo(rows, tipos, TIPO_ASIGNACION.Traslado);
}

async function filtrarPorTipo(nombreTipo) {
  const idTipo = await getIdTipoAsignacion(nombreTipo);
  const rows = await asignacionService.getAll();
  return asignacionService.filtrarPorTipoId(rows, idTipo);
}

export async function listar(rows) {
  if (rows) {
    const idTipo = await getIdTipoAsignacion(TIPO_ASIGNACION.Traslado);
    return asignacionService.filtrarPorTipoId(rows, idTipo);
  }
  return filtrarPorTipo(TIPO_ASIGNACION.Traslado);
}

export async function getById(id) {
  return asignacionService.getById(id);
}

export async function leerOrigen(idActivo) {
  const activo = await activoService.getById(idActivo);
  const ubicaciones = await ubicacionService.getAll();
  const ubicacion = byId(ubicaciones, activo.idUbicacion);
  return {
    activo,
    idUbicacionOrigen: activo.idUbicacion ?? null,
    origenNombre: nombreUbicacion(ubicacion),
  };
}

async function persistir(command) {
  if (env.useApiMock) {
    return asignacionService.create({
      idActivo: command.idActivo,
      idUsuario: command.idUsuario,
      idResponsable: command.idResponsable,
      idEstado: command.idEstado,
      idTipoAsignacion: await getIdTipoAsignacion(TIPO_ASIGNACION.Traslado),
      fechaAsignacion: command.fechaAsignacion,
      fechaDevolucion: command.fechaAsignacion,
      activa: false,
      observaciones: command.observaciones,
      documentoPdfUrl: null,
      idUbicacion: command.idUbicacionDestino,
    });
  }

  try {
    const response = await httpClient.post(`${apiPaths.asignaciones}/traslado`, command);
    invalidateAfterMutation('asignaciones');
    return { id: idFromCreated(response, null), ...command };
  } catch (error) {
    throw applyApiFieldErrors(error);
  }
}

async function aplicarEfectosMock({ activo, idUbicacionDestino, idAsignacion, motivo }) {
  if (!env.useApiMock) return;
  await activoService.update(activo.id, { idUbicacion: idUbicacionDestino });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Traslado',
    descripcion: 'Traslado de activo',
    informacionAnterior: `id_ubicacion=${activo.idUbicacion ?? ''}`,
    informacionNueva: `id_ubicacion=${idUbicacionDestino}; motivo=${motivo ?? ''}`,
  });
}

export async function registrar({
  idActivo,
  idUbicacionDestino,
  idUsuario,
  idResponsable,
  fecha,
  motivo,
}) {
  const idEstado = await getIdEstado(ESTADO_ACTIVO.Asignado);
  const { activo, origenNombre, idUbicacionOrigen } = await leerOrigen(idActivo);

  if (Number(idUbicacionDestino) === Number(idUbicacionOrigen)) {
    const error = new Error('El destino no puede ser igual al origen.');
    error.fieldErrors = { idUbicacionDestino: 'El destino no puede ser igual al origen.' };
    throw error;
  }

  const ubicaciones = await ubicacionService.getAll();
  const destino = byId(ubicaciones, idUbicacionDestino);
  const destinoNombre = nombreUbicacion(destino);
  const observaciones = formatTrasladoObservaciones({
    origen: origenNombre,
    destino: destinoNombre,
    detalle: '',
  });

  const created = await persistir({
    idActivo: Number(idActivo),
    idUsuario: Number(idUsuario),
    idResponsable: Number(idResponsable),
    idEstado,
    idUbicacionDestino: Number(idUbicacionDestino),
    fechaAsignacion: fecha,
    motivo: String(motivo ?? '').trim() || null,
    observaciones,
  });

  await aplicarEfectosMock({
    activo,
    idUbicacionDestino: Number(idUbicacionDestino),
    idAsignacion: created.id,
    motivo: String(motivo ?? '').trim() || null,
  });

  return created;
}
