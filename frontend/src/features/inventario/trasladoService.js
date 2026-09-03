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
import { env } from '@/shared/config/env';
import { byId } from '@/shared/utils/format';

export { parseTrasladoRuta };

async function filtrarPorTipo(nombreTipo) {
  const idTipo = await getIdTipoAsignacion(nombreTipo);
  const rows = await asignacionService.getAll();
  return (rows ?? []).filter((row) => Number(row.idTipoAsignacion) === Number(idTipo));
}

export async function listar() {
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

/**
 * Punto de conexión BE-16.
 * Hoy: POST /api/Asignaciones (CreateAsignacionCommand ya recibe idUbicacion).
 * Cuando exista POST /api/Asignaciones/traslado, cambiar solo el cuerpo de `persistir`.
 */
async function persistir(payload) {
  return asignacionService.create(payload);
}

async function aplicarEfectosMock({ activo, idUbicacionDestino, idAsignacion }) {
  if (!env.useApiMock) return;
  await activoService.update(activo.id, { idUbicacion: idUbicacionDestino });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Creacion',
    descripcion: 'Traslado de activo',
    informacionAnterior: `idUbicacion=${activo.idUbicacion ?? ''}`,
    informacionNueva: `idUbicacion=${idUbicacionDestino}`,
  });
}

export async function registrar({
  idActivo,
  idUbicacionDestino,
  idUsuario,
  idResponsable,
  fecha,
  observaciones,
}) {
  const idTipoAsignacion = await getIdTipoAsignacion(TIPO_ASIGNACION.Traslado);
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
  const texto = formatTrasladoObservaciones({
    origen: origenNombre,
    destino: destinoNombre,
    detalle: observaciones,
  });

  const created = await persistir({
    idActivo: Number(idActivo),
    idUsuario: Number(idUsuario),
    idResponsable: Number(idResponsable),
    idEstado,
    idTipoAsignacion,
    fechaAsignacion: fecha,
    fechaDevolucion: null,
    activa: true,
    observaciones: texto,
    documentoPdfUrl: null,
    idUbicacion: Number(idUbicacionDestino),
  });

  await aplicarEfectosMock({
    activo,
    idUbicacionDestino: Number(idUbicacionDestino),
    idAsignacion: created.id,
  });

  return created;
}
