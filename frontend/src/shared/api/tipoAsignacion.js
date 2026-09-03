/**
 * Lookup de Tipo_Asignacion y Estado por nombre.
 * Los ids salen del seed (Scripts/SeedCatalogosAddendum.sql) y no se hardcodean.
 * Comparación acento-insensible, igual que TipoAsignacionNombres en Application.
 */
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';

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

let tiposCache = null;
let estadosCache = null;
let tiposPending = null;
let estadosPending = null;

export function invalidateCatalogoAsignacionCache() {
  tiposCache = null;
  estadosCache = null;
  tiposPending = null;
  estadosPending = null;
}

async function loadTipos() {
  if (tiposCache) return tiposCache;
  if (!tiposPending) {
    tiposPending = tipoAsignacionService.getAll().then((rows) => {
      tiposCache = Array.isArray(rows) ? rows : [];
      tiposPending = null;
      return tiposCache;
    });
  }
  return tiposPending;
}

async function loadEstados() {
  if (estadosCache) return estadosCache;
  if (!estadosPending) {
    estadosPending = estadoService.getAll().then((rows) => {
      estadosCache = Array.isArray(rows) ? rows : [];
      estadosPending = null;
      return estadosCache;
    });
  }
  return estadosPending;
}

function findByNombre(items, nombre, kind) {
  const found = (items ?? []).find((item) => nombresCatalogoIguales(item.nombre, nombre));
  if (!found) {
    console.error(`[catalogo] No existe ${kind} «${nombre}». Respuesta:`, items);
    throw new CatalogoIncompletoError(kind, nombre);
  }
  return found;
}

export async function getIdTipoAsignacion(nombre) {
  const tipos = await loadTipos();
  return findByNombre(tipos, nombre, 'el tipo de asignación').id;
}

export async function getIdEstado(nombre) {
  const estados = await loadEstados();
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
