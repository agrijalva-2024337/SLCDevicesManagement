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
const loadAppLayout = () => import('@/shared/layout/AppLayout');
const loadEmpresas = () => import('@/features/organizacion/empresas/EmpresasPage');
const loadSedes = () => import('@/features/organizacion/sedes/SedesPage');
const loadCatalogo = () => import('@/features/catalogos/CatalogoPage');

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
    ...named(loadAppLayout, 'AppLayout'),
    children: [
      { index: true, ...named(loadHome, 'HomePage') },
      {
        path: 'catalogos/empresas',
        ...named(loadEmpresas, 'EmpresasPage'),
        children: [
          { path: 'nueva', ...named(loadEmpresas, 'EmpresaFormPage') },
          { path: ':id/editar', ...named(loadEmpresas, 'EmpresaFormPage') },
          { path: ':id', ...named(loadEmpresas, 'EmpresaDetallePage') },
        ],
      },
      {
        path: 'catalogos/sedes',
        ...named(loadSedes, 'SedesPage'),
        children: [
          { path: 'nueva', ...named(loadSedes, 'SedeFormPage') },
          { path: ':id/editar', ...named(loadSedes, 'SedeFormPage') },
          { path: ':id', ...named(loadSedes, 'SedeDetallePage') },
        ],
      },
      {
        path: 'catalogos/:slug',
        ...named(loadCatalogo, 'CatalogoPage'),
        children: [
          { path: 'nueva', ...named(loadCatalogo, 'MaestroFormPage') },
          { path: ':id/editar', ...named(loadCatalogo, 'MaestroFormPage') },
          { path: ':id', ...named(loadCatalogo, 'MaestroDetallePage') },
        ],
      },
    ],
  },
  {
    path: '*',
    ...named(loadNotFound, 'NotFoundPage'),
  },
]);
