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
      { path: 'catalogos/empresas', ...named(loadEmpresas, 'EmpresasPage') },
      { path: 'catalogos/sedes', ...named(loadSedes, 'SedesPage') },
      { path: 'catalogos/:slug', ...named(loadCatalogo, 'CatalogoPage') },
    ],
  },
  {
    path: '*',
    ...named(loadNotFound, 'NotFoundPage'),
  },
]);
