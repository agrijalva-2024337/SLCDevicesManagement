import { Link, useLocation } from 'react-router';
import { getPageTitle } from '@/shared/layout/navigation';

export function Topbar({ sidebarOpen, onMenuToggle }) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="app-topbar sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="app-icon-btn"
          onClick={onMenuToggle}
          aria-label={sidebarOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
        >
          <i className={sidebarOpen ? 'pi pi-times' : 'pi pi-bars'} aria-hidden="true" />
        </button>
        <h1 className="truncate font-display text-base font-bold tracking-tight text-navy sm:text-xl">
          {title}
        </h1>
      </div>

      <Link to="/" className="app-link-quiet shrink-0 sm:text-sm">
        Volver al sitio
      </Link>
    </header>
  );
}
