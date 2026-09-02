/**
 * Rutas REST alineadas a los controllers de SLCDM.Api
 * (`[Route("api/[controller]")]` y rutas explícitas de Auth/Health).
 */
export const apiPaths = {
  health: '/api/health',
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/profile',
  },
  paises: '/api/Paises',
  empresas: '/api/Empresas',
  sedes: '/api/Sedes',
  areas: '/api/Areas',
  usuarios: '/api/Usuarios',
  responsables: '/api/Responsables',
  bitacoras: '/api/Bitacoras',
  estados: '/api/Estados',
  tiposAsignacion: '/api/TiposAsignacion',
  categoriasActivo: '/api/CategoriasActivo',
  proveedores: '/api/Proveedores',
  ubicaciones: '/api/Ubicaciones',
  activos: '/api/Activos',
  asignaciones: '/api/Asignaciones',
  historicosInventario: '/api/HistoricosInventario',
  detallesActivo: '/api/DetallesActivos',
  historialActivos: '/api/HistorialActivos',
};
