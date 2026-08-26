import type { ReactNode } from 'react';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-800">
      <header className="border-b border-navy/10 bg-navy text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-gold">SLCDevicesManagement</p>
            <p className="text-sm text-slate-200">Inventario de Activos Multiempresa</p>
          </div>
          <p className="hidden text-xs text-slate-300 sm:block">
            SLC · Sistemas Logísticos y Corporativos
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
