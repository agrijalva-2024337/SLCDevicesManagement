import { useCallback, useState } from 'react';
import * as authService from '@/features/auth/authService';
import { getSessionUser } from '@/shared/services/tokenStorage';

export function useAuth() {
  const [usuario, setUsuario] = useState(() => getSessionUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await authService.login(credentials);
      setUsuario(session.usuario);
      return session;
    } catch (err) {
      setError(err);
      setUsuario(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUsuario(null);
    setError(null);
  }, []);

  return {
    usuario,
    isAuthenticated: Boolean(usuario),
    isLoading,
    error,
    login,
    logout,
  };
}
