import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/app/pages/HomePage';
import { PlaceholderPage } from '@/app/pages/PlaceholderPage';
import { ForbiddenPage } from '@/app/pages/ForbiddenPage';
import { ProtectedRoute } from '@/shared/auth/ProtectedRoute';
import { ROLES } from '@/shared/auth/authRoles';
import { AppLayout } from '@/shared/layout/AppLayout';

const ADMINS = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_EMPRESA];
const OPERACION = [...ADMINS, ROLES.OPERADOR];
const LECTURA = [...OPERACION, ROLES.CONSULTA];

function modulePage(title, roles, description) {
  return (
    <ProtectedRoute roles={roles}>
      <PlaceholderPage title={title} description={description} />
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="organizacion/empresas"
          element={modulePage('Empresas', [ROLES.ADMIN_GENERAL])}
        />
        <Route path="organizacion/sedes" element={modulePage('Sedes', ADMINS)} />
        <Route path="organizacion/areas" element={modulePage('Áreas', ADMINS)} />
        <Route path="catalogos" element={modulePage('Catálogos', [ROLES.ADMIN_GENERAL])} />
        <Route path="activos" element={modulePage('Activos', LECTURA)} />
        <Route path="asignaciones" element={modulePage('Asignaciones', OPERACION)} />
        <Route path="traslados" element={modulePage('Traslados', OPERACION)} />
        <Route path="mantenimientos" element={modulePage('Mantenimientos', OPERACION)} />
        <Route path="bajas" element={modulePage('Bajas', ADMINS)} />
        <Route path="inventario" element={modulePage('Inventario físico', OPERACION)} />
        <Route path="reportes" element={modulePage('Reportes', LECTURA)} />
        <Route path="sin-acceso" element={<ForbiddenPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
