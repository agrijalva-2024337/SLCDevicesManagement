import { Link, useLocation } from 'react-router';
import { getPageTitle } from '@/shared/layout/navigation';

export function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between border-b border-border bg-surface-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-navy lg:hidden"
          onClick={onMenuToggle}
          aria-label="Abrir menú de navegación"
          aria-controls="app-sidebar"
        >
          <i className="pi pi-bars" aria-hidden="true" />
        </button>
        <h1 className="font-display text-lg font-bold tracking-tight text-navy sm:text-xl">
          {title}
        </h1>
      </div>

      <Link
        to="/"
        className="text-sm font-medium text-text-muted transition-colors hover:text-navy"
      >
        Ir al inicio
      </Link>
    </header>
  );
}
