import { createBrowserRouter } from 'react-router';

function named(importer, exportName) {
  return {
    lazy: async () => {
      const module = await importer();
      return { Component: module[exportName] };
    },
  };
}

const loadLanding = () => import('@/features/landing/LandingPage');
const loadDashboard = () => import('@/features/reportes/DashboardPage');
const loadLogin = () => import('@/features/auth/LoginPage');
const loadNotFound = () => import('@/app/pages/NotFoundPage');
const loadGuard = () => import('@/features/auth/RutaProtegida');
const loadAppLayout = () => import('@/shared/layout/AppLayout');
const loadEmpresas = () => import('@/features/organizacion/empresas/EmpresasPage');
const loadSedes = () => import('@/features/organizacion/sedes/SedesPage');
const loadCatalogo = () => import('@/features/catalogos/CatalogoPage');
const loadActivosHub = () => import('@/features/activos/ActivosHubPage');
const loadBitacora = () => import('@/features/organizacion/bitacoras/BitacoraPage');
const loadJornadas = () => import('@/features/inventario/JornadasPage');
const loadJornadaDetalle = () => import('@/features/inventario/JornadaDetallePage');
const loadReportes = () => import('@/features/reportes/ReportesPage');
const loadActivosReporte = () => import('@/features/reportes/ActivosReportePage');

const writeChildren = (loader, formExport, detailExport) => [
  {
    ...named(loadGuard, 'RutaEscritura'),
    children: [
      { path: 'nueva', ...named(loader, formExport) },
      { path: ':id/editar', ...named(loader, formExport) },
    ],
  },
  { path: ':id', ...named(loader, detailExport) },
];

export const router = createBrowserRouter([
  {
    path: '/',
    ...named(loadLanding, 'LandingPage'),
  },
  {
    path: '/login',
    ...named(loadLogin, 'LoginPage'),
  },
  {
    path: '/app',
    ...named(loadGuard, 'RutaProtegida'),
    children: [
      {
        ...named(loadAppLayout, 'AppLayout'),
        children: [
          { index: true, ...named(loadDashboard, 'DashboardPage') },
          {
            path: 'catalogos/empresas',
            ...named(loadEmpresas, 'EmpresasPage'),
            children: writeChildren(loadEmpresas, 'EmpresaFormPage', 'EmpresaDetallePage'),
          },
          {
            path: 'catalogos/sedes',
            ...named(loadSedes, 'SedesPage'),
            children: writeChildren(loadSedes, 'SedeFormPage', 'SedeDetallePage'),
          },
          {
            path: 'catalogos/:slug',
            ...named(loadCatalogo, 'CatalogoPage'),
            children: writeChildren(loadCatalogo, 'MaestroFormPage', 'MaestroDetallePage'),
          },
          { path: 'activos', ...named(loadActivosHub, 'ActivosHubPage') },
          { path: 'asignaciones', ...named(loadActivosHub, 'RedirectToActivosVista') },
          { path: 'traslados', ...named(loadActivosHub, 'RedirectToActivosVista') },
          { path: 'mantenimientos', ...named(loadActivosHub, 'RedirectToActivosVista') },
          { path: 'bajas', ...named(loadActivosHub, 'RedirectToActivosVista') },
          { path: 'inventario-fisico', ...named(loadJornadas, 'JornadasPage') },
          { path: 'inventario-fisico/:id', ...named(loadJornadaDetalle, 'JornadaDetallePage') },
          { path: 'reportes', ...named(loadReportes, 'ReportesPage') },
          { path: 'reportes/activos', ...named(loadActivosReporte, 'ActivosReportePage') },
          {
            path: 'bitacora',
            ...named(loadGuard, 'RutaAdministrador'),
            children: [{ index: true, ...named(loadBitacora, 'BitacoraPage') }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    ...named(loadNotFound, 'NotFoundPage'),
  },
]);
