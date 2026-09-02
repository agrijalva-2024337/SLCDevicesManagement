import { useEffect, useId, useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { MOCK_EMPRESAS_ACTIVAS, NAV_SECTIONS } from '@/shared/layout/navConfig';

function linkClassName({ isActive }) {
  return [
    'block rounded-md px-3 py-1.5 text-sm',
    isActive
      ? 'bg-slate-800 font-medium text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ');
}

export function AppLayout() {
  const empresaSelectId = useId();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState(String(MOCK_EMPRESAS_ACTIVAS[0].id));
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-label="Cerrar menú de navegación"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">DERCAS</p>
          <p className="text-sm font-semibold">Inventario de activos</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.disabled ? (
                      <span
                        className="block cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-slate-500"
                        aria-disabled="true"
                        title="Disponible en un sprint siguiente"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={linkClassName}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="rounded-md border border-slate-200 p-2 text-slate-700 lg:hidden"
              aria-label="Abrir menú de navegación"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="block h-0.5 w-4 bg-current" />
              <span className="mt-1 block h-0.5 w-4 bg-current" />
              <span className="mt-1 block h-0.5 w-4 bg-current" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold sm:text-base">SLCDevicesManagement</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Sistemas Logísticos y Corporativos, S.A.
              </p>
            </div>

            <div className="min-w-0">
              <label htmlFor={empresaSelectId} className="sr-only">
                Empresa activa
              </label>
              <select
                id={empresaSelectId}
                className="max-w-36 truncate rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm sm:max-w-64 sm:px-3"
                value={empresaId}
                onChange={(event) => setEmpresaId(event.target.value)}
              >
                {MOCK_EMPRESAS_ACTIVAS.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                Usuario
              </button>
              {userMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-md">
                  <p className="px-3 py-2 text-xs text-slate-500">Sesión de demostración</p>
                  <button
                    type="button"
                    className="block w-full cursor-not-allowed px-3 py-2 text-left text-sm text-slate-400"
                    disabled
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          Sistemas Logísticos y Corporativos, S.A.
        </footer>
      </div>
    </div>
  );
}
