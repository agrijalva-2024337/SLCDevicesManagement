import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwt, isJwtExpired } from '@/features/auth/decodeJwt';
import * as authService from '@/features/auth/authService';
import { AuthClaimTypes, RolUsuario, rolFromClaim } from '@/shared/api/contracts';
import { env } from '@/shared/config/env';
import { getAccessToken, getSessionUser } from '@/shared/services/tokenStorage';

const AuthContext = createContext(null);

export function canWriteCatalog(rol, resource) {
  if (rol == null || rol === RolUsuario.Consulta) {
    return false;
  }

  if (resource === 'paises' || resource === 'empresas-create') {
    return rol === RolUsuario.AdministradorGeneral;
  }

  if (resource === 'ubicaciones') {
    return rol >= RolUsuario.OperadorInventario;
  }

  return rol >= RolUsuario.AdministradorEmpresa;
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
  };
}

function useAuthState() {
  const [usuario, setUsuario] = useState(() => getSessionUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
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

  const value = useMemo(
    () => ({
      usuario,
      rol,
      idEmpresa,
      isAuthenticated: Boolean(getAccessToken() && usuario),
      isLoading,
      isReady,
      error,
      login,
      logout,
      canWrite: (resource) => canWriteCatalog(rol, resource),
    }),
    [usuario, rol, idEmpresa, isLoading, isReady, error, login, logout],
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
