export const CATALOG_TTL_MS = 10 * 60 * 1000;
export const TRANSACTION_TTL_MS = 30 * 1000;
export const REPORT_TTL_MS = 60 * 1000;

const TRANSACTION_RESOURCES = new Set([
  'activos',
  'asignaciones',
  'historialActivos',
  'historicosInventario',
  'detallesActivo',
  'dispositivos',
  'consulta',
]);

export function cleanQueryParams(params) {
  if (!params || typeof params !== 'object') {
    return {};
  }

  const next = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || key === 'signal') {
      continue;
    }
    if (key === 'incluirInhabilitados') {
      continue;
    }
    next[key] = value;
  }
  return next;
}

export function listQueryKey(resource, params) {
  const cleaned = cleanQueryParams(params);
  if (Object.keys(cleaned).length === 0) {
    return [resource, 'list'];
  }
  return [resource, 'list', cleaned];
}

export function detailQueryKey(resource, id) {
  return [resource, 'detail', String(id)];
}

export function reportQueryKey(name, params) {
  const cleaned = cleanQueryParams(params);
  if (Object.keys(cleaned).length === 0) {
    return ['reportes', name];
  }
  return ['reportes', name, cleaned];
}

export function ttlForKey(key) {
  const resource = Array.isArray(key) ? key[0] : key;
  if (resource === 'reportes') {
    return REPORT_TTL_MS;
  }
  if (TRANSACTION_RESOURCES.has(resource)) {
    return TRANSACTION_TTL_MS;
  }
  return CATALOG_TTL_MS;
}

const ENDPOINT_RESOURCE = {
  '/api/Paises': 'paises',
  '/api/Empresas': 'empresas',
  '/api/Sedes': 'sedes',
  '/api/Areas': 'areas',
  '/api/Usuarios': 'usuarios',
  '/api/Responsables': 'responsables',
  '/api/Bitacoras': 'bitacoras',
  '/api/Estados': 'estados',
  '/api/TiposAsignacion': 'tiposAsignacion',
  '/api/CategoriasActivo': 'categoriasActivo',
  '/api/Proveedores': 'proveedores',
  '/api/Ubicaciones': 'ubicaciones',
  '/api/RedesConocidas': 'redesConocidas',
  '/api/Activos': 'activos',
  '/api/Asignaciones': 'asignaciones',
  '/api/HistoricosInventario': 'historicosInventario',
  '/api/DetallesActivos': 'detallesActivo',
  '/api/HistorialActivos': 'historialActivos',
  '/api/MotivosBaja': 'motivosBaja',
  '/api/TiposMantenimiento': 'tiposMantenimiento',
};

export function resourceFromEndpoint(endpoint) {
  return ENDPOINT_RESOURCE[endpoint] ?? endpoint.replace(/^\/api\//, '').replaceAll('/', '-');
}
