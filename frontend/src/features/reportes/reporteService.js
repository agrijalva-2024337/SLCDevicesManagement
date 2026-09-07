import { activosPorCategoria as categoriasSeed } from '@/features/reportes/mocks/activosPorCategoria';
import { activosPorResponsable as responsablesSeed } from '@/features/reportes/mocks/activosPorResponsable';
import { activosPorSede as sedesSeed } from '@/features/reportes/mocks/activosPorSede';
import { activosPorUbicacion as ubicacionesSeed } from '@/features/reportes/mocks/activosPorUbicacion';
import { activosReporte } from '@/features/reportes/mocks/activosReporte';
import { diferenciasInventario as diferenciasSeed } from '@/features/reportes/mocks/diferenciasInventario';
import { inventarioGeneral as inventarioSeed } from '@/features/reportes/mocks/inventarioGeneral';
import { ESTADO_OPERATIVO } from '@/shared/api/contracts';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';

function wait() {
  return new Promise((resolve) => {
    setTimeout(resolve, 280);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function byEmpresa(rows, idEmpresa) {
  if (idEmpresa == null || idEmpresa === '') return clone(rows);
  const wanted = Number(idEmpresa);
  return clone(rows).filter((row) => Number(row.idEmpresa) === wanted);
}

function cleanParams(params) {
  const next = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    next[key] = value;
  }
  return next;
}

function normalizarEstado(raw) {
  const n = String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  if (n === ESTADO_OPERATIVO.Disponible || n === 'disponibles') return ESTADO_OPERATIVO.Disponible;
  if (n === ESTADO_OPERATIVO.Asignado || n === 'asignados') return ESTADO_OPERATIVO.Asignado;
  if (n === ESTADO_OPERATIVO.Mantenimiento || n === 'enmantenimiento') return ESTADO_OPERATIVO.Mantenimiento;
  if (n === ESTADO_OPERATIVO.Baja || n === 'dadosdebaja' || n === 'dadodebaja') return ESTADO_OPERATIVO.Baja;
  return null;
}

function isoPlusDays(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getLista(path, params) {
  const response = await httpClient.get(path, { params: cleanParams(params) });
  return response.data;
}

export async function inventarioGeneral({ idEmpresa } = {}) {
  if (env.useApiMock) {
    await wait();
    return byEmpresa(inventarioSeed, idEmpresa);
  }
  return getLista(apiPaths.reportes.inventarioGeneral, { idEmpresa });
}

export async function activosPorSede({ idEmpresa, idSede } = {}) {
  if (env.useApiMock) {
    await wait();
    let rows = byEmpresa(sedesSeed, idEmpresa);
    if (idSede != null && idSede !== '') {
      rows = rows.filter((row) => Number(row.idSede) === Number(idSede));
    }
    return rows;
  }
  return getLista(apiPaths.reportes.activosPorSede, { idEmpresa, idSede });
}

export async function activosPorUbicacion({ idEmpresa, idSede } = {}) {
  if (env.useApiMock) {
    await wait();
    let rows = byEmpresa(ubicacionesSeed, idEmpresa);
    if (idSede != null && idSede !== '') {
      rows = rows.filter((row) => Number(row.idSede) === Number(idSede));
    }
    return rows;
  }
  return getLista(apiPaths.reportes.activosPorUbicacion, { idEmpresa, idSede });
}

export async function activosPorCategoria({ idEmpresa } = {}) {
  if (env.useApiMock) {
    await wait();
    return byEmpresa(categoriasSeed, idEmpresa);
  }
  return getLista(apiPaths.reportes.activosPorCategoria, { idEmpresa });
}

export async function activosPorResponsable({ idEmpresa } = {}) {
  if (env.useApiMock) {
    await wait();
    return byEmpresa(responsablesSeed, idEmpresa);
  }
  return getLista(apiPaths.reportes.activosPorResponsable, { idEmpresa });
}

export async function activos({
  estado,
  idEmpresa,
  idSede,
  idCategoriaActivo,
  idResponsable,
  skip = 0,
  take = 100,
} = {}) {
  if (env.useApiMock) {
    await wait();
    if (estado != null && estado !== '' && !normalizarEstado(estado)) {
      const error = new Error('El campo estado debe ser disponible, asignado, mantenimiento o baja.');
      error.status = 400;
      throw error;
    }
    let rows = byEmpresa(activosReporte, idEmpresa);
    const estadoNorm = normalizarEstado(estado);
    if (estadoNorm) rows = rows.filter((row) => row.estadoOperativo === estadoNorm);
    if (idSede != null && idSede !== '') {
      rows = rows.filter((row) => Number(row.idSede) === Number(idSede));
    }
    if (idCategoriaActivo != null && idCategoriaActivo !== '') {
      rows = rows.filter((row) => Number(row.idCategoriaActivo) === Number(idCategoriaActivo));
    }
    if (idResponsable != null && idResponsable !== '') {
      rows = rows.filter((row) => Number(row.idResponsable) === Number(idResponsable));
    }
    return rows
      .sort((left, right) => String(left.activo?.nombre ?? '').localeCompare(right.activo?.nombre ?? '', 'es'))
      .slice(Number(skip) || 0, (Number(skip) || 0) + (Number(take) || 100))
      .map((row) => ({
        activo: row.activo,
        estadoOperativo: row.estadoOperativo,
        idSede: row.idSede,
        nombreSede: row.nombreSede,
        idResponsable: row.idResponsable,
      }));
  }

  return getLista(apiPaths.reportes.activos, {
    estado,
    idEmpresa,
    idSede,
    idCategoriaActivo,
    idResponsable,
    skip,
    take,
  });
}

export async function garantiasPorVencer({ idEmpresa, dias = 30 } = {}) {
  const ventana = Number(dias) || 30;

  if (env.useApiMock) {
    await wait();
    const catalogo = Object.fromEntries(activosReporte.map((row) => [row.activo.id, row.activo]));
    const filas = [
      { idActivo: 4, diasRestantes: 6, idSede: 5, nombreSede: 'Patio Mixco Norte', idEmpresa: 5 },
      { idActivo: 1, diasRestantes: 22, idSede: 3, nombreSede: 'Oficina Central Reforma', idEmpresa: 1 },
      { idActivo: 2, diasRestantes: 68, idSede: 3, nombreSede: 'Oficina Central Reforma', idEmpresa: 1 },
    ];
    return filas
      .filter((row) => row.diasRestantes <= ventana)
      .filter((row) => idEmpresa == null || idEmpresa === '' || Number(row.idEmpresa) === Number(idEmpresa))
      .map((row) => ({
        activo: {
          ...clone(catalogo[row.idActivo]),
          fechaVencimientoGarantia: isoPlusDays(row.diasRestantes),
        },
        fechaVencimientoGarantia: isoPlusDays(row.diasRestantes),
        diasRestantes: row.diasRestantes,
        idSede: row.idSede,
        nombreSede: row.nombreSede,
      }));
  }

  return getLista(apiPaths.reportes.garantiasPorVencer, { idEmpresa, dias: ventana });
}

export async function diferenciasInventario({ idEmpresa } = {}) {
  if (env.useApiMock) {
    await wait();
    return byEmpresa(diferenciasSeed, idEmpresa);
  }
  return getLista(apiPaths.reportes.diferenciasInventario, { idEmpresa });
}
