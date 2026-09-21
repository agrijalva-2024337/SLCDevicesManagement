import { lazy, Suspense } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { RouteFallback } from '@/app/RouteFallback';
import { ActivosVistaNav } from '@/features/activos/ActivosVistaNav';
import { resolveActivosVista, vistaFromLegacyPath } from '@/features/activos/activosVistas';

const VISTAS = {
  activos: lazy(() => import('@/features/activos/ActivosPage').then((m) => ({ default: m.ActivosPage }))),
  asignaciones: lazy(() =>
    import('@/features/asignaciones/AsignacionesPage').then((m) => ({ default: m.AsignacionesPage })),
  ),
  traslados: lazy(() =>
    import('@/features/inventario/TrasladosPage').then((m) => ({ default: m.TrasladosPage })),
  ),
  mantenimientos: lazy(() =>
    import('@/features/mantenimientos/MantenimientosPage').then((m) => ({ default: m.MantenimientosPage })),
  ),
  bajas: lazy(() => import('@/features/bajas/BajasPage').then((m) => ({ default: m.BajasPage }))),
};

export function ActivosHubPage() {
  const [params] = useSearchParams();
  const vista = resolveActivosVista(params.get('vista'));
  const Vista = VISTAS[vista];

  return (
    <>
      <ActivosVistaNav />
      <Suspense fallback={<RouteFallback />}>
        <Vista />
      </Suspense>
    </>
  );
}

export function RedirectToActivosVista() {
  const location = useLocation();
  const vista = vistaFromLegacyPath(location.pathname);
  const params = new URLSearchParams(location.search);
  if (vista) params.set('vista', vista);
  const query = params.toString();
  return <Navigate to={query ? `/app/activos?${query}` : '/app/activos'} replace state={location.state} />;
}
