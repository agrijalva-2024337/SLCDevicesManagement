import * as activoService from '@/features/activos/activoService';
import * as historialActivoService from '@/features/activos/historialActivoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import { ESTADO_ACTIVO, TIPO_ASIGNACION, getIdEstado, getIdTipoAsignacion } from '@/shared/api/tipoAsignacion';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';
import { invalidateAfterMutation } from '@/shared/data/mutationInvalidation';
import { signatureToPayload } from '@/shared/utils/signaturePayload';

export function filtrarBajas(rows, tipos) {
  return asignacionService.filtrarPorNombreTipo(rows, tipos, TIPO_ASIGNACION.Baja);
}

export async function listar(rows) {
  const idTipo = await getIdTipoAsignacion(TIPO_ASIGNACION.Baja);
  const source = rows ?? (await asignacionService.getAll());
  return asignacionService.filtrarPorTipoId(source, idTipo);
}

export async function getById(id) {
  return asignacionService.getById(id);
}

function toCommand({
  idActivo,
  idUsuario,
  idResponsable,
  idEstado,
  idMotivoBaja,
  idAutorizadoPor,
  documentoReferencia,
  documentoPdfUrl,
  fecha,
  observaciones,
  firmaEntrega,
  firmaRecibe,
}) {
  const entrega = signatureToPayload(firmaEntrega);
  const recibe = signatureToPayload(firmaRecibe);
  return {
    idActivo: Number(idActivo),
    idUsuario: Number(idUsuario),
    idResponsable: Number(idResponsable),
    idEstado: Number(idEstado),
    idMotivoBaja: Number(idMotivoBaja),
    idAutorizadoPor: Number(idAutorizadoPor),
    documentoReferencia: String(documentoReferencia ?? '').trim() || null,
    documentoPdfUrl: String(documentoPdfUrl ?? '').trim(),
    fechaAsignacion: fecha,
    observaciones: String(observaciones ?? '').trim() || null,
    firmaEntrega: entrega,
    firmaRecibe: recibe,
    fechaFirmaEntrega: entrega || recibe ? new Date().toISOString() : null,
  };
}

async function persistir(command) {
  if (env.useApiMock) {
    return asignacionService.create({
      ...command,
      idTipoAsignacion: await getIdTipoAsignacion(TIPO_ASIGNACION.Baja),
      fechaDevolucion: null,
      activa: true,
    });
  }

  try {
    const response = await httpClient.post(`${apiPaths.asignaciones}/baja`, command);
    const id =
      typeof response.data === 'object' && response.data?.id != null
        ? Number(response.data.id)
        : Number(response.data);
    invalidateAfterMutation('asignaciones');
    return { id, ...command };
  } catch (error) {
    throw applyApiFieldErrors(error);
  }
}

async function aplicarEfectosMock({ activo, command, idAsignacion }) {
  if (!env.useApiMock) return;
  await activoService.update(activo.id, { idEstado: command.idEstado });
  await historialActivoService.registrarMovimientoMock({
    idAsignacion,
    idDetalleActivo: null,
    fechaHora: new Date().toISOString(),
    tipoOperacion: 'Baja',
    descripcion: 'Baja de activo',
    informacionAnterior: `id_activo=${command.idActivo}`,
    informacionNueva: `id_motivo_baja=${command.idMotivoBaja}; documento_pdf_url=${command.documentoPdfUrl}; id_autorizado_por=${command.idAutorizadoPor}; id_responsable=${command.idResponsable}`,
  });
}

function conflictoOcupado(idActivo, asignaciones, idAsignacion, idMantenimiento, idBaja) {
  const activa = (asignaciones ?? []).find((row) => Number(row.idActivo) === Number(idActivo) && row.activa);
  if (!activa) return null;
  const tipo = Number(activa.idTipoAsignacion);
  if (tipo === Number(idBaja)) {
    return 'El activo ya esta dado de baja.';
  }
  if (tipo === Number(idAsignacion) || tipo === Number(idMantenimiento)) {
    return 'El activo tiene una asignacion o un mantenimiento activo. Cierren el proceso antes de dar de baja.';
  }
  return null;
}

export async function registrar(input) {
  const idEstado = await getIdEstado(ESTADO_ACTIVO.DadoDeBaja);
  const [idAsignacion, idMantenimiento, idBaja] = await Promise.all([
    getIdTipoAsignacion(TIPO_ASIGNACION.Asignacion),
    getIdTipoAsignacion(TIPO_ASIGNACION.Mantenimiento),
    getIdTipoAsignacion(TIPO_ASIGNACION.Baja),
  ]);
  const asignaciones = await asignacionService.getAll();
  const ocupado = conflictoOcupado(input.idActivo, asignaciones, idAsignacion, idMantenimiento, idBaja);
  if (ocupado) {
    const error = new Error(ocupado);
    error.status = 409;
    throw error;
  }

  const activo = await activoService.getById(input.idActivo);
  const command = toCommand({ ...input, idEstado });
  const created = await persistir(command);
  await aplicarEfectosMock({ activo, command, idAsignacion: created.id });
  return created;
}
