import { Suspense, useState } from 'react';
import { Outlet } from 'react-router';
import { EmpresaActivaProvider } from '@/features/organizacion/empresas/useEmpresaActiva';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { Sidebar } from '@/shared/layout/Sidebar';
import { Topbar } from '@/shared/layout/Topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <EmpresaActivaProvider>
      <div className="app-canvas flex min-h-dvh text-navy">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen((open) => !open)} />
          {sidebarOpen ? (
            <button
              type="button"
              className="app-sidebar-backdrop"
              aria-label="Cerrar menú de navegación"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <main id="contenido" className="app-main flex-1 min-w-0">
            <div className="app-content-inner">
              <Suspense fallback={<FeedbackState status="loading" loadingMessage="Cargando el módulo…" />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </EmpresaActivaProvider>
  );
}
