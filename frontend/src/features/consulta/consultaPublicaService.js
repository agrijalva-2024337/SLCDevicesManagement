import { estadoNombreDeActivo } from '@/features/activos/activoAcciones';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as categoriaService from '@/features/catalogos/categorias/categoriaService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import * as areaService from '@/features/organizacion/areas/areaService';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import { byId } from '@/shared/utils/format';

export function consultaPath(codigo) {
  return `/consulta/${encodeURIComponent(codigo)}`;
}

export function consultaUrlDe(codigo) {
  if (typeof window === 'undefined') return consultaPath(codigo);
  return `${window.location.origin}${consultaPath(codigo)}`;
}

export function qrImageUrlDe(consultaUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(consultaUrl)}`;
}

/** El QR trae la URL completa; escrito a mano puede venir solo el código. */
export function codigoDesdeQr(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/\/consulta\/([^/?#]+)/i);
  if (match) return decodeURIComponent(match[1]);
  return raw.replace(/^\/+|\/+$/g, '');
}

function notFound() {
  const error = new Error('Este código no corresponde a un activo registrado.');
  error.status = 404;
  return error;
}

export async function getFichaPublica(codigo) {
  const needle = String(codigo ?? '').trim();
  if (!needle) throw notFound();

  if (!env.useApiMock) {
    const response = await httpClient.get(apiPaths.consultaPublica(needle));
    return response.data;
  }

  const [lista, categorias, ubicaciones, sedes, empresas, areas, responsables, estados, asignaciones] =
    await Promise.all([
      activoService.getAll(),
      categoriaService.getAll(),
      ubicacionService.getAll(),
      sedeService.getAll(),
      empresaService.getAll(),
      areaService.getAll(),
      responsableService.getAll(),
      estadoService.getAll(),
      asignacionService.getAll(),
    ]);

  const activo = (lista ?? []).find((row) => String(row.tokenConsulta) === needle);
  if (!activo) throw notFound();

  const ubicacion = byId(ubicaciones, activo.idUbicacion);
  const sede = byId(sedes, ubicacion?.idSede);
  const empresa = byId(empresas, sede?.idEmpresa);
  const categoria = byId(categorias, activo.idCategoriaActivo);
  const estado = estadoNombreDeActivo(activo, { asignaciones, estados });
  const asignada = (asignaciones ?? []).find(
    (row) => Number(row.idActivo) === Number(activo.id) && row.activa,
  );
  const responsable = asignada ? byId(responsables, asignada.idResponsable) : null;
  const area = responsable ? byId(areas, responsable.idArea) : null;

  return {
    nombre: activo.nombre,
    codigoInterno: activo.codigoInterno ?? activo.numeroSerie ?? String(activo.id),
    marca: activo.marca ?? null,
    modelo: activo.modelo ?? null,
    numeroSerie: activo.numeroSerie ?? null,
    categoria: categoria?.nombre ?? null,
    empresa: empresa?.nombre ?? null,
    sede: sede?.nombre ?? null,
    ubicacion: nombreUbicacion(ubicacion),
    estado,
    responsable: responsable?.nombreCompleto ?? null,
    area: area?.nombre ?? null,
    garantiaHasta: activo.fechaVencimientoGarantia ?? null,
    descripcion: activo.descripcion ?? null,
  };
}

export async function getQrDeActivo(idActivo) {
  if (!env.useApiMock) {
    const [activo, response] = await Promise.all([
      activoService.getById(idActivo),
      httpClient.get(apiPaths.activoQr(idActivo), {
        responseType: 'blob',
        headers: { Accept: 'image/png' },
      }),
    ]);

    const blob = response.data;
    if (!(blob instanceof Blob) || blob.size === 0 || (blob.type && blob.type.includes('json'))) {
      const error = new Error('No se pudo generar el código QR.');
      error.status = 500;
      throw error;
    }

    const codigo = activo.tokenPublico ?? activo.tokenConsulta;
    const consultaUrl = codigo ? consultaUrlDe(codigo) : '';
    return {
      codigo: codigo ?? '',
      consultaUrl,
      imageUrl: URL.createObjectURL(blob),
    };
  }

  const activo = await activoService.getById(idActivo);
  const codigo = activo.tokenConsulta;
  if (!codigo) {
    const error = new Error('Este activo aún no tiene código de consulta.');
    error.status = 404;
    throw error;
  }

  const consultaUrl = consultaUrlDe(codigo);
  return {
    codigo,
    consultaUrl,
    imageUrl: qrImageUrlDe(consultaUrl),
  };
}
