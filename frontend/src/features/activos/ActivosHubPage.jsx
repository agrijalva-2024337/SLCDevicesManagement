import { Navigate, useLocation, useSearchParams } from 'react-router';
import { ActivosPage } from '@/features/activos/ActivosPage';
import { ActivosVistaNav } from '@/features/activos/ActivosVistaNav';
import { resolveActivosVista, vistaFromLegacyPath } from '@/features/activos/activosVistas';
import { AsignacionesPage } from '@/features/asignaciones/AsignacionesPage';
import { BajasPage } from '@/features/bajas/BajasPage';
import { TrasladosPage } from '@/features/inventario/TrasladosPage';
import { MantenimientosPage } from '@/features/mantenimientos/MantenimientosPage';

const VISTAS = {
  activos: ActivosPage,
  asignaciones: AsignacionesPage,
  traslados: TrasladosPage,
  mantenimientos: MantenimientosPage,
  bajas: BajasPage,
};

export function ActivosHubPage() {
  const [params] = useSearchParams();
  const vista = resolveActivosVista(params.get('vista'));
  const Vista = VISTAS[vista];

  return (
    <>
      <ActivosVistaNav />
      <Vista />
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
