import { AuthProvider } from '@/features/auth/useAuth';
import { EmpresaActivaProvider } from '@/features/organizacion/empresas/useEmpresaActiva';

/** Providers de sesión y empresa activa (envuelven también /login). */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <EmpresaActivaProvider>{children}</EmpresaActivaProvider>
    </AuthProvider>
  );
}
