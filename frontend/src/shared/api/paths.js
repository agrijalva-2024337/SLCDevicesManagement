/**
 * Rutas REST que el frontend va a consumir.
 *
 * Todavía no hay controllers (eso es el siguiente sprint). Los paths siguen
 * la convención `/api/{recurso}` en camelCase JSON, alineada al Domain y a
 * lo que ya usaban los catálogos de FE-03. Cuando BE-07 / BE-08 / BE-09
 * publiquen DTOs y endpoints, se ajusta solo este archivo.
 */
export const apiPaths = {
  health: '/weatherforecast',
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
  },
  paises: '/api/paises',
  empresas: '/api/empresas',
  sedes: '/api/sedes',
  areas: '/api/areas',
  usuarios: '/api/usuarios',
  responsables: '/api/responsables',
  bitacoras: '/api/bitacoras',
  estados: '/api/estados',
  tiposAsignacion: '/api/tipos-asignacion',
  categoriasActivo: '/api/categorias',
  proveedores: '/api/proveedores',
  ubicaciones: '/api/ubicaciones',
  activos: '/api/activos',
  asignaciones: '/api/asignaciones',
  historicosInventario: '/api/historicos-inventario',
  detallesActivo: '/api/detalles-activo',
  historialActivos: '/api/historial-activos',
};
