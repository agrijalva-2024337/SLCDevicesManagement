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
  // [API] ruta no confirmada: no hay RedesConocidasController; verificar contra Swagger
  redesConocidas: '/api/RedesConocidas',
  dispositivos: {
    rastreo: '/api/Dispositivos/rastreo',
    rastreoByActivo: (idActivo) => `/api/Dispositivos/rastreo/${idActivo}`,
    fueraDeRango: '/api/Dispositivos/fuera-de-rango',
  },
  activos: '/api/Activos',
  // [API] imagen QR del activo; confirmar en Swagger (blob o { imageUrl, consultaUrl })
  activoQr: (id) => `/api/Activos/${id}/qr`,
  // [API] ficha pública sin login; confirmar path y nombre del código
  consultaPublica: (codigo) => `/api/Consulta/${codigo}`,
  asignaciones: '/api/Asignaciones',
  // [API] multipart archivo PDF; confirmar cuando exista el controller
  asignacionVerificarPdf: (id) => `/api/Asignaciones/${id}/pdf/verificar`,
  historicosInventario: '/api/HistoricosInventario',
  detallesActivo: '/api/DetallesActivos',
  historialActivos: '/api/HistorialActivos',
  motivosBaja: '/api/MotivosBaja',
  tiposMantenimiento: '/api/TiposMantenimiento',
  reportes: {
    inventarioGeneral: '/api/Reportes/inventario-general',
    activosPorSede: '/api/Reportes/activos-por-sede',
    activosPorUbicacion: '/api/Reportes/activos-por-ubicacion',
    activosPorCategoria: '/api/Reportes/activos-por-categoria',
    activosPorResponsable: '/api/Reportes/activos-por-responsable',
    activos: '/api/Reportes/activos',
    garantiasPorVencer: '/api/Reportes/garantias-por-vencer',
    diferenciasInventario: '/api/Reportes/diferencias-inventario',
  },
};
