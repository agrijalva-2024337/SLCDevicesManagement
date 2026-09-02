import { Link, useLocation } from 'react-router';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { getPageTitle } from '@/shared/layout/navigation';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

function EmpresaSelector() {
  const { empresas, idActiva, isAdminGeneral, isLocked, isLoading, selectEmpresa } = useEmpresaActiva();
  const options = isLocked ? empresas.filter((empresa) => Number(empresa.id) === Number(idActiva)) : empresas;

  return (
    <label className="app-empresa-select">
      <span className="sr-only">Empresa activa</span>
      <select
        className="app-input"
        value={idActiva ?? ''}
        disabled={isLocked || isLoading}
        onChange={(event) => selectEmpresa(event.target.value)}
        aria-label="Empresa activa"
      >
        {isAdminGeneral ? <option value="">Todas las empresas</option> : null}
        {options.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nombre}
          </option>
        ))}
        {isLocked && options.length === 0 ? <option value={idActiva ?? ''}>Empresa asignada</option> : null}
      </select>
    </label>
  );
}

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

      <div className="flex shrink-0 items-center gap-3">
        <EmpresaSelector />
        <ThemeToggle />
        <Link to="/" className="app-link-quiet sm:text-sm">
          Volver al sitio
        </Link>
      </div>
    </header>
  );
}
