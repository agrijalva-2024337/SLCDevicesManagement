import { createBrowserRouter } from 'react-router';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { AppLayout } from '@/shared/layout/AppLayout';

const placeholderRoutes = [
  'activos',
  'asignaciones',
  'traslados',
  'mantenimientos',
  'bajas',
  'inventario-fisico',
  'bitacora',
  'reportes',
].map((segment) => ({
  path: segment,
  element: <PlaceholderPage />,
}));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // [API] <RutaProtegida> validará token y perfil antes de renderizar /app
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'catalogos/:slug', element: <PlaceholderPage /> },
      ...placeholderRoutes,
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
