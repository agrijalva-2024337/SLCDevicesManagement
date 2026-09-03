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
const loadHome = () => import('@/app/pages/HomePage');
const loadLogin = () => import('@/features/auth/LoginPage');
const loadNotFound = () => import('@/app/pages/NotFoundPage');
const loadGuard = () => import('@/features/auth/RutaProtegida');
const loadAppLayout = () => import('@/shared/layout/AppLayout');
const loadEmpresas = () => import('@/features/organizacion/empresas/EmpresasPage');
const loadSedes = () => import('@/features/organizacion/sedes/SedesPage');
const loadCatalogo = () => import('@/features/catalogos/CatalogoPage');
const loadTraslados = () => import('@/features/inventario/TrasladosPage');
const loadMantenimientos = () => import('@/features/mantenimientos/MantenimientosPage');

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
          { index: true, ...named(loadHome, 'HomePage') },
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
          { path: 'traslados', ...named(loadTraslados, 'TrasladosPage') },
          { path: 'mantenimientos', ...named(loadMantenimientos, 'MantenimientosPage') },
        ],
      },
    ],
  },
  {
    path: '*',
    ...named(loadNotFound, 'NotFoundPage'),
  },
]);
