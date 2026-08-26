export const ROLES = {
  ADMIN_GENERAL: 'admin_general',
  ADMIN_EMPRESA: 'admin_empresa',
  OPERADOR: 'operador',
  CONSULTA: 'consulta',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN_GENERAL]: 'Administrador general',
  [ROLES.ADMIN_EMPRESA]: 'Administrador de empresa',
  [ROLES.OPERADOR]: 'Operador de inventario',
  [ROLES.CONSULTA]: 'Consulta',
};

/**
 * Sin sesión (role nulo) no se bloquea: el login llega en FE-05.
 * Con rol simulado, se filtra navegación y rutas.
 */
export function canAccess(role, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (!role) {
    return true;
  }

  return allowedRoles.includes(role);
}
