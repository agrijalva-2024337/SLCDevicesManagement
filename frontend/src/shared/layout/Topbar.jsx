import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { rolUsuarioLabel } from '@/shared/api/contracts';
import { getPageTitle } from '@/shared/layout/navigation';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

function EmpresaSelector() {
  const { empresas, idActiva, isAdminGeneral, isLocked, isLoading, selectEmpresa } = useEmpresaActiva();
  const options = isLocked
    ? empresas.filter((empresa) => Number(empresa.id) === Number(idActiva))
    : empresas;

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

function UserMenu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!usuario) return null;

  const nombre =
    String(usuario.nombres ?? '').trim() ||
    String(usuario.username ?? '').trim() ||
    'Usuario';
  const correo = String(usuario.correo ?? '').trim();
  const rol = rolUsuarioLabel[usuario.rol] ?? usuario.role ?? '—';

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-user-menu" ref={rootRef}>
      <button
        type="button"
        className="app-icon-btn"
        aria-label="Cuenta de usuario"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="pi pi-user" aria-hidden="true" />
      </button>
      {open ? (
        <div id={menuId} className="app-user-panel" role="menu">
          <div className="app-user-panel-head">
            <p className="app-user-panel-name">{nombre}</p>
            {correo ? <p className="app-user-panel-meta">{correo}</p> : null}
            <p className="app-user-panel-meta">{rol}</p>
          </div>
          <button type="button" className="app-user-panel-logout" role="menuitem" onClick={handleLogout}>
            <i className="pi pi-sign-out" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Topbar({ sidebarOpen, onMenuToggle }) {
  const { pathname, search } = useLocation();
  const title = getPageTitle(pathname, search);

  return (
    <header className="app-topbar sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {!sidebarOpen ? (
          <button
            type="button"
            className="app-icon-btn"
            onClick={onMenuToggle}
            aria-label="Abrir menú de navegación"
            aria-controls="app-sidebar"
            aria-expanded={false}
          >
            <i className="pi pi-bars" aria-hidden="true" />
          </button>
        ) : null}
        <h1 className="truncate font-display text-base font-bold tracking-tight text-navy sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <EmpresaSelector />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
