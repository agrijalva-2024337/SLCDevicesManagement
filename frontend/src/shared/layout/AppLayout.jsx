import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { Sidebar } from '@/shared/layout/Sidebar';
import { Topbar } from '@/shared/layout/Topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const start = () => {
      import('@/shared/data/warmAppCache').then((module) => {
        if (!controller.signal.aborted) module.warmAppCache(controller.signal);
      });
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => {
        controller.abort();
        window.cancelIdleCallback(id);
      };
    }
    const id = window.setTimeout(start, 1200);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, []);

  return (
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
            <Suspense
              fallback={<FeedbackState status="loading" loadingMessage="Cargando el módulo…" />}
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
