import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { PageHeader } from '@/shared/components/PageHeader';

function writeResourceFromPathname(pathname) {
  if (!/\/(nueva|[^/]+\/editar)$/.test(pathname)) {
    return null;
  }

  if (pathname.includes('/catalogos/empresas')) {
    return pathname.endsWith('/nueva') ? 'empresas-create' : 'empresas';
  }

  const match = pathname.match(/\/catalogos\/([^/]+)/);
  return match?.[1] ?? null;
}

export function SinPermiso({ compact = false, onClose }) {
  const body = (
    <p className="text-base text-navy">
      Tu perfil no tiene permiso para esta acción. Pedí un rol con escritura o volvé al catálogo.
    </p>
  );

  if (compact) {
    return (
      <DetailOverlay open title="Sin permiso" kicker="Acceso" onClose={onClose}>
        {body}
      </DetailOverlay>
    );
  }

  return (
    <section>
      <PageHeader title="Sin permiso" description="Esta pantalla requiere un perfil con más privilegios." />
      <div className="app-feedback app-feedback--empty" role="status">
        {body}
      </div>
    </section>
  );
}

export function RutaProtegida() {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <FeedbackState status="loading" loadingMessage="Validando la sesión…" />;
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}

export function RutaEscritura() {
  const { canWrite } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const resource = writeResourceFromPathname(location.pathname);

  if (resource && !canWrite(resource)) {
    const parent = location.pathname.replace(/\/(nueva|[^/]+\/editar)$/, '');
    return <SinPermiso compact onClose={() => navigate(parent || '/app')} />;
  }

  return <Outlet context={outlet} />;
}
