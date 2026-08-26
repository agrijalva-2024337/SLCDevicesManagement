import { Navigate } from 'react-router-dom';
import { canAccess } from '@/shared/auth/authRoles';
import { useAuth } from '@/shared/auth/useAuth';

/**
 * Reserva el enrutamiento por rol para FE-05.
 * Hoy: sin sesión deja pasar. Con rol simulado, redirige si no aplica.
 *
 * @param {object} props
 * @param {string[]} [props.roles] Roles permitidos. Vacío o ausente = todos.
 * @param {import('react').ReactNode} props.children
 */
export function ProtectedRoute({ roles, children }) {
  const { role } = useAuth();

  if (canAccess(role, roles)) {
    return children;
  }

  return <Navigate to="/sin-acceso" replace />;
}
