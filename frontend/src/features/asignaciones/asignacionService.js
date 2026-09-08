import * as activoService from '@/features/activos/activoService';
import { asignaciones } from '@/features/asignaciones/mocks/asignaciones';
import { ESTADO_ACTIVO, TIPO_ASIGNACION, getIdEstado, getIdTipoAsignacion } from '@/shared/api/tipoAsignacion';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { createMockCrudService } from '@/shared/services/createMockCrudService';
import { signatureToPayload } from '@/shared/utils/signaturePayload';
import { sha256File } from '@/shared/utils/sha256';

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const crud = createMockCrudService({
  endpoint: apiPaths.asignaciones,
  seed: asignaciones,
});

export const { getAll, getById, create, update, remove } = crud;

export function estaVigente(row) {
  return Boolean(row?.activa) && !row?.fechaDevolucion;
}

export async function listarEntregas() {
  const idTipo = await getIdTipoAsignacion(TIPO_ASIGNACION.Asignacion);
  const rows = await getAll();
  return (rows ?? []).filter((row) => Number(row.idTipoAsignacion) === Number(idTipo));
}

async function registrarMovimiento(entry) {
  if (!env.useApiMock) return;
  const { registrarMovimientoMock } = await import('@/features/activos/historialActivoService');
  await registrarMovimientoMock(entry);
}

async function assertActivoLibre(idActivo) {
  const [idAsignacion, idMantenimiento, idBaja] = await Promise.all([
    getIdTipoAsignacion(TIPO_ASIGNACION.Asignacion),
    getIdTipoAsignacion(TIPO_ASIGNACION.Mantenimiento),
    getIdTipoAsignacion(TIPO_ASIGNACION.Baja),
  ]);
  const rows = await getAll();
  const activa = (rows ?? []).find((row) => Number(row.idActivo) === Number(idActivo) && row.activa);
  if (!activa) return;

  const tipo = Number(activa.idTipoAsignacion);
  if (tipo === Number(idBaja)) {
    const error = new Error('El activo está dado de baja. No se puede asignar.');
    error.fieldErrors = { idActivo: error.message };
    throw error;
  }
  if (tipo === Number(idMantenimiento)) {
    const error = new Error('El activo está en mantenimiento. Finalícelo antes de asignarlo.');
    error.fieldErrors = { idActivo: error.message };
    throw error;
  }
  if (tipo === Number(idAsignacion)) {
    const error = new Error('El activo ya tiene una asignación activa.');
    error.fieldErrors = { idActivo: error.message };
    throw error;
  }
}

export async function entregar({
  idActivo,
  idUsuario,
  idResponsable,
  fecha,
  observaciones,
  firmaEntrega,
  firmaRecibe,
}) {
  await assertActivoLibre(idActivo);
  const idTipoAsignacion = await getIdTipoAsignacion(TIPO_ASIGNACION.Asignacion);
  const idEstado = await getIdEstado(ESTADO_ACTIVO.Asignado);
  const activo = await activoService.getById(idActivo);
  const entrega = signatureToPayload(firmaEntrega);
  const recibe = signatureToPayload(firmaRecibe);
  const firmo = Boolean(entrega || recibe);

  const created = await create({
    idActivo: Number(idActivo),
    idUsuario: Number(idUsuario),
    idResponsable: Number(idResponsable),
    idEstado,
    idTipoAsignacion,
    fechaAsignacion: fecha,
    fechaDevolucion: null,
    activa: true,
    observaciones: String(observaciones ?? '').trim() || null,
    firmaEntrega: entrega,
    firmaRecibe: recibe,
    fechaFirmaEntrega: firmo ? new Date().toISOString() : null,
    documentoPdfUrl: env.useApiMock && firmo ? '/mocks/acta-asignacion-1.pdf' : null,
    documentoPdfGeneradoEn: env.useApiMock && firmo ? new Date().toISOString() : null,
    hashDocumento: null,
    idUbicacion: activo.idUbicacion,
  });

  if (env.useApiMock) {
    await activoService.update(activo.id, { idEstado });
    await registrarMovimiento({
      idAsignacion: created.id,
      idDetalleActivo: null,
      fechaHora: new Date().toISOString(),
      tipoOperacion: 'Creacion',
      descripcion: 'Entrega de activo',
      informacionAnterior: null,
      informacionNueva: `Activo ${activo.id} entregado a responsable ${idResponsable} en ubicacion ${activo.idUbicacion}.`,
    });
  }

  return created;
}

export async function devolver(id, data = {}) {
  const numericId = Number(id);
  const fechaDevolucion = data.fechaDevolucion || new Date().toISOString();
  const patch = {
    activa: false,
    fechaDevolucion,
    observaciones: data.observaciones,
  };

  if (env.useApiMock) {
    const current = await crud.getById(numericId);
    const updated = await crud.update(numericId, {
      ...patch,
      observaciones: data.observaciones ?? current.observaciones,
    });
    const idDisponible = await getIdEstado(ESTADO_ACTIVO.Disponible);
    await activoService.update(current.idActivo, { idEstado: idDisponible });
    await registrarMovimiento({
      idAsignacion: numericId,
      idDetalleActivo: null,
      fechaHora: new Date().toISOString(),
      tipoOperacion: 'Modificacion',
      descripcion: 'Devolucion de activo',
      informacionAnterior: 'activa=true',
      informacionNueva: `activa=false; fecha_devolucion=${fechaDevolucion}`,
    });
    return updated;
  }

  await httpClient.post(`${apiPaths.asignaciones}/${numericId}/devolver`, {
    id: numericId,
    fechaDevolucion,
    observaciones: data.observaciones ?? null,
  });
  return { id: numericId, ...patch };
}

export async function verificarDocumento(id, file) {
  if (!file) {
    const error = new Error('Seleccione un archivo PDF.');
    error.fieldErrors = { archivo: error.message };
    throw error;
  }

  const isPdf = file.type === 'application/pdf' || String(file.name ?? '').toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    const error = new Error('Solo se aceptan archivos PDF.');
    error.fieldErrors = { archivo: error.message };
    throw error;
  }

  if (env.useApiMock) {
    await wait(400);
    const row = await getById(id);
    const firmaDocumento = await sha256File(file);
    const hashRegistro = row.hashDocumento
      ? String(row.hashDocumento).toLowerCase()
      : row.documentoPdfHash
        ? String(row.documentoPdfHash).toLowerCase()
        : null;
    return {
      coincide: Boolean(hashRegistro) && hashRegistro === firmaDocumento,
      hashRegistro,
      firmaDocumento,
      fechaGenerado: row.documentoPdfGeneradoEn ?? row.documentoPdfGenerardoEn ?? null,
    };
  }

  const form = new FormData();
  form.append('archivo', file);
  const response = await httpClient.post(apiPaths.asignacionVerificarPdf(id), form);
  const data = response.data ?? {};
  return {
    coincide: Boolean(data.coincide ?? data.esValido),
    hashRegistro: data.hashRegistro ?? data.hashDocumento ?? data.documentoPdfHash ?? null,
    firmaDocumento: data.firmaDocumento ?? null,
    fechaGenerado: data.fechaGenerado ?? data.fechaGeneracionOriginal ?? null,
  };
}
