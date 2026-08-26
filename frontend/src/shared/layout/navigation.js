import { ROLES } from '@/shared/auth/authRoles';

const ADMINS = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_EMPRESA];
const OPERACION = [...ADMINS, ROLES.OPERADOR];
const LECTURA = [...OPERACION, ROLES.CONSULTA];

/**
 * Navegación por módulo de negocio (no por tipo de archivo).
 * `roles: null` = visible para todos, incluida consulta.
 */
export const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', path: '/', roles: null },
  {
    id: 'organizacion',
    label: 'Organización',
    roles: ADMINS,
    children: [
      {
        id: 'empresas',
        label: 'Empresas',
        path: '/organizacion/empresas',
        roles: [ROLES.ADMIN_GENERAL],
      },
      {
        id: 'sedes',
        label: 'Sedes',
        path: '/organizacion/sedes',
        roles: ADMINS,
      },
      {
        id: 'areas',
        label: 'Áreas',
        path: '/organizacion/areas',
        roles: ADMINS,
      },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    path: '/catalogos',
    roles: [ROLES.ADMIN_GENERAL],
  },
  { id: 'activos', label: 'Activos', path: '/activos', roles: LECTURA },
  {
    id: 'asignaciones',
    label: 'Asignaciones',
    path: '/asignaciones',
    roles: OPERACION,
  },
  { id: 'traslados', label: 'Traslados', path: '/traslados', roles: OPERACION },
  {
    id: 'mantenimientos',
    label: 'Mantenimientos',
    path: '/mantenimientos',
    roles: OPERACION,
  },
  { id: 'bajas', label: 'Bajas', path: '/bajas', roles: ADMINS },
  {
    id: 'inventario',
    label: 'Inventario físico',
    path: '/inventario',
    roles: OPERACION,
  },
  { id: 'reportes', label: 'Reportes', path: '/reportes', roles: LECTURA },
];

export function filterNavItems(items, role, canAccessFn) {
  return items
    .map((item) => {
      if (item.children) {
        const children = filterNavItems(item.children, role, canAccessFn);
        if (!canAccessFn(role, item.roles) || children.length === 0) {
          return null;
        }
        return { ...item, children };
      }

      if (!canAccessFn(role, item.roles)) {
        return null;
      }

      return item;
    })
    .filter(Boolean);
}
