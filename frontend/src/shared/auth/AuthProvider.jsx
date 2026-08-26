import { useMemo, useState } from 'react';
import { AuthContext } from '@/shared/auth/authContext';
import { canAccess } from '@/shared/auth/authRoles';

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);

  const value = useMemo(() => {
    const user = role ? { id: 'simulated', name: 'Usuario simulado', role } : null;

    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      setSimulatedRole: setRole,
      hasRole: (allowedRoles) => canAccess(role, allowedRoles),
    };
  }, [role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
