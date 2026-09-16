import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwt, isJwtExpired } from '@/features/auth/decodeJwt';
import * as authService from '@/features/auth/authService';
import { clearEmpresaActivaStorage } from '@/features/organizacion/empresas/empresaActivaStorage';
import { AuthClaimTypes, RolUsuario, rolFromClaim } from '@/shared/api/contracts';
import { env } from '@/shared/config/env';
import { getAccessToken, getSessionUser } from '@/shared/services/tokenStorage';
import { clearQueryCache } from '@/shared/data/queryCache';

const AuthContext = createContext(null);

export function canWriteCatalog(rol, resource) {
  if (rol == null) {
    return false;
  }

  if (resource === 'empresas-create' || resource === 'empresas' || resource === 'usuarios' || resource === 'paises') {
    return rol === RolUsuario.AdministradorGeneral;
  }

  // Catálogos / administración: Operador solo lista (sin registrar/editar/deshabilitar).
  if (
    resource === 'sedes' ||
    resource === 'areas' ||
    resource === 'ubicaciones' ||
    resource === 'responsables' ||
    resource === 'proveedores' ||
    resource === 'categorias' ||
    resource === 'estados' ||
    resource === 'tipos-asignacion' ||
    resource === 'redes-conocidas' ||
    resource === 'bitacora'
  ) {
    return rol >= RolUsuario.AdministradorEmpresa;
  }

  // Módulos operativos: el Operador sí puede trabajar.
  if (
    resource === 'traslados' ||
    resource === 'mantenimientos' ||
    resource === 'activos' ||
    resource === 'asignaciones' ||
    resource === 'inventario-fisico' ||
    resource === 'bajas' ||
    resource === 'rastreo'
  ) {
    return rol >= RolUsuario.OperadorInventario;
  }

  return rol >= RolUsuario.AdministradorEmpresa;
}

/** Recursos que el Operador de inventario puede abrir (listado / operación). */
const OPERADOR_ACCESO = new Set([
  'sedes',
  'areas',
  'paises',
  'ubicaciones',
  'responsables',
  'activos',
  'asignaciones',
  'traslados',
  'mantenimientos',
  'bajas',
  'inventario-fisico',
  'rastreo',
  'escanear',
]);

/**
 * Visibilidad de pantallas (menú y URL). Más estricto que canWrite:
 * el Operador ve solo sedes/áreas/países/ubicaciones/responsables + módulos operativos.
 */
export function canAccessAppResource(rol, resource) {
  if (rol == null || resource == null) {
    return false;
  }

  if (resource === 'empresas' || resource === 'empresas-create' || resource === 'usuarios') {
    return rol === RolUsuario.AdministradorGeneral;
  }

  if (rol >= RolUsuario.AdministradorEmpresa) {
    return true;
  }

  if (rol === RolUsuario.OperadorInventario) {
    return OPERADOR_ACCESO.has(resource);
  }

  return false;
}

/** Mapea una ruta /app/... al recurso de permisos. */
export function appResourceFromPathname(pathname) {
  if (!pathname || pathname === '/app' || pathname === '/app/') {
    return null;
  }
  if (pathname.startsWith('/app/bitacora')) return 'bitacora';
  if (pathname.startsWith('/app/activos')) return 'activos';
  if (pathname.startsWith('/app/inventario-fisico')) return 'inventario-fisico';
  if (pathname.startsWith('/app/rastreo')) return 'rastreo';
  if (pathname.startsWith('/app/escanear')) return 'escanear';
  if (pathname.startsWith('/app/asignaciones')) return 'asignaciones';
  if (pathname.startsWith('/app/traslados')) return 'traslados';
  if (pathname.startsWith('/app/mantenimientos')) return 'mantenimientos';
  if (pathname.startsWith('/app/bajas')) return 'bajas';

  const catalogo = pathname.match(/^\/app\/catalogos\/([^/]+)/);
  if (catalogo) return catalogo[1];

  return null;
}

function sessionFromToken(token, stored) {
  const payload = decodeJwt(token);
  if (!payload) {
    return stored;
  }

  const rol = rolFromClaim(payload[AuthClaimTypes.role] ?? stored?.rol);
  const rawEmpresa = payload[AuthClaimTypes.idEmpresa];
  const idEmpresa = rawEmpresa === '' || rawEmpresa == null ? null : Number(rawEmpresa);

  return {
    ...stored,
    id: stored?.id ?? (payload.sub ? Number(payload.sub) : null),
    nombres: stored?.nombres ?? payload.name ?? '',
    correo: stored?.correo ?? payload.email ?? '',
    rol: rol ?? stored?.rol ?? null,
    role: payload[AuthClaimTypes.role] ?? stored?.role,
    idEmpresa: Number.isFinite(idEmpresa) ? idEmpresa : (stored?.idEmpresa ?? null),
    // La lista autorizada viene de /me o login (no del JWT: claims repetidos no parsean bien en JSON).
    empresasAutorizadas: Array.isArray(stored?.empresasAutorizadas) ? stored.empresasAutorizadas : [],
  };
}

function useAuthState() {
  const [usuario, setUsuario] = useState(() => getSessionUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    clearQueryCache();
    clearEmpresaActivaStorage();
    authService.logout();
    setUsuario(null);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getAccessToken();
      const stored = getSessionUser();

      if (!token) {
        if (!cancelled) {
          setUsuario(null);
          setIsReady(true);
        }
        return;
      }

      if (env.useApiMock) {
        if (!cancelled) {
          setUsuario(stored);
          setIsReady(true);
        }
        return;
      }

      const payload = decodeJwt(token);
      if (!payload || isJwtExpired(payload)) {
        logout();
        if (!cancelled) {
          setIsReady(true);
        }
        return;
      }

      if (!cancelled) {
        setUsuario(sessionFromToken(token, stored));
      }

      try {
        const me = await authService.getMe();
        if (!cancelled) {
          setUsuario(sessionFromToken(token, me));
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authService.login(credentials);
      const token = getAccessToken();
      const next = env.useApiMock ? session.usuario : sessionFromToken(token, session.usuario);
      setUsuario(next);
      return { ...session, usuario: next };
    } catch (err) {
      setError(err);
      setUsuario(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rol = usuario?.rol ?? null;
  const idEmpresa = usuario?.idEmpresa ?? null;
  const empresasAutorizadas = usuario?.empresasAutorizadas ?? [];

  const value = useMemo(
    () => ({
      usuario,
      rol,
      idEmpresa,
      empresasAutorizadas,
      isAuthenticated: Boolean(getAccessToken() && usuario),
      isLoading,
      isReady,
      error,
      login,
      logout,
      canWrite: (resource) => canWriteCatalog(rol, resource),
      canAccess: (resource) => canAccessAppResource(rol, resource),
    }),
    [usuario, rol, idEmpresa, empresasAutorizadas, isLoading, isReady, error, login, logout],
  );

  return value;
}

export function AuthProvider({ children }) {
  const value = useAuthState();
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
