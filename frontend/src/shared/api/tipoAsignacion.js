/**
 * Lookup de Tipo_Asignacion y Estado por nombre.
 * Los ids salen del seed / catálogo por empresa y no se hardcodean.
 * Comparación acento-insensible, igual que TipoAsignacionNombres en Application.
 */
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { fetchQuery, invalidateQueries } from '@/shared/data/queryCache';
import { listQueryKey, ttlForKey } from '@/shared/data/queryKeys';

export const TIPO_ASIGNACION = {
  Asignacion: 'Asignacion',
  Traslado: 'Traslado',
  Mantenimiento: 'Mantenimiento',
  Baja: 'Baja',
};

export const ESTADO_ACTIVO = {
  Disponible: 'Disponible',
  Asignado: 'Asignado',
  EnMantenimiento: 'En mantenimiento',
  DadoDeBaja: 'Dado de baja',
};

export class CatalogoIncompletoError extends Error {
  constructor(kind, nombre) {
    super(`Catálogo incompleto: no existe ${kind} «${nombre}».`);
    this.name = 'CatalogoIncompletoError';
    this.kind = kind;
    this.nombre = nombre;
  }
}

export function normalizarNombreCatalogo(nombre) {
  return String(nombre ?? '')
    .trim()
    .replaceAll('ó', 'o')
    .replaceAll('Ó', 'o')
    .toLowerCase();
}

export function nombresCatalogoIguales(actual, esperado) {
  return normalizarNombreCatalogo(actual) === normalizarNombreCatalogo(esperado);
}

const TIPOS_KEY = listQueryKey('tiposAsignacion');
const ESTADOS_KEY = listQueryKey('estados');
const EMPRESA_STORAGE_KEY = 'slcdm_empresa_activa';

export function invalidateCatalogoAsignacionCache() {
  invalidateQueries(['tiposAsignacion']);
  invalidateQueries(['estados']);
}

function readEmpresaActivaId() {
  try {
    const raw = window.localStorage.getItem(EMPRESA_STORAGE_KEY);
    if (raw == null || raw === '') return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function scopeByEmpresa(items, idEmpresa) {
  const rows = Array.isArray(items) ? items : [];
  if (idEmpresa == null || idEmpresa === '') {
    return rows;
  }
  if (!rows.some((item) => item?.idEmpresa != null && item.idEmpresa !== '')) {
    return rows;
  }
  const wanted = Number(idEmpresa);
  return rows.filter((item) => Number(item.idEmpresa) === wanted);
}

async function loadTipos() {
  const rows = await fetchQuery(TIPOS_KEY, () => tipoAsignacionService.getAll(), {
    ttlMs: ttlForKey(TIPOS_KEY),
  });
  return Array.isArray(rows) ? rows : [];
}

async function loadEstados() {
  const rows = await fetchQuery(ESTADOS_KEY, () => estadoService.getAll(), {
    ttlMs: ttlForKey(ESTADOS_KEY),
  });
  return Array.isArray(rows) ? rows : [];
}

function findByNombre(items, nombre, kind) {
  const found = (items ?? []).find((item) => nombresCatalogoIguales(item.nombre, nombre));
  if (!found) {
    console.error(`[catalogo] No existe ${kind} «${nombre}». Respuesta:`, items);
    throw new CatalogoIncompletoError(kind, nombre);
  }
  return found;
}

function resolveEmpresaId(idEmpresa) {
  if (idEmpresa != null && idEmpresa !== '') {
    return Number(idEmpresa);
  }
  return readEmpresaActivaId();
}

export async function getIdTipoAsignacion(nombre, idEmpresa) {
  const tipos = scopeByEmpresa(await loadTipos(), resolveEmpresaId(idEmpresa));
  return findByNombre(tipos, nombre, 'el tipo de asignación').id;
}

export async function getIdEstado(nombre, idEmpresa) {
  const estados = scopeByEmpresa(await loadEstados(), resolveEmpresaId(idEmpresa));
  return findByNombre(estados, nombre, 'el estado').id;
}

export async function getTipoAsignacionById(id) {
  const tipos = await loadTipos();
  return tipos.find((item) => Number(item.id) === Number(id)) ?? null;
}

export async function getEstadoById(id) {
  const estados = await loadEstados();
  return estados.find((item) => Number(item.id) === Number(id)) ?? null;
}
