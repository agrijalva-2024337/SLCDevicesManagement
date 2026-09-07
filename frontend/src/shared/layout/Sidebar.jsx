import { NavLink } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { RolUsuario } from '@/shared/api/contracts';
import { navigation } from '@/shared/layout/navigation';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

function linkClass({ isActive }) {
  return `app-nav-link ${isActive ? 'is-active' : ''}`;
}

function NavItemContent({ icon, label }) {
  return (
    <>
      {icon ? <i className={icon} aria-hidden="true" /> : null}
      {label}
    </>
  );
}

function DisabledNavItem({ icon, label }) {
  return (
    <span className="app-nav-link is-disabled" aria-disabled="true" title="Disponible en un sprint siguiente">
      <NavItemContent icon={icon} label={label} />
    </span>
  );
}

function isVisibleToRol(item, rol) {
  if (!item.adminOnly) return true;
  return rol != null && rol >= RolUsuario.AdministradorEmpresa;
}

export function Sidebar({ open, onClose }) {
  const { rol } = useAuth();

  function closeOnMobile() {
    if (window.matchMedia('(max-width: 1023.98px)').matches) {
      onClose();
    }
  }

  return (
    <aside
      id="app-sidebar"
      className={`app-sidebar sticky top-0 h-dvh shrink-0 overflow-hidden text-text-on-dark transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'w-[var(--sidebar-width)]' : 'w-0'
      }`}
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="flex h-full w-[var(--sidebar-width)] flex-col">
        <div className="app-sidebar-head flex h-[var(--header-height)] items-center justify-between gap-2 px-4">
          <NavLink to="/app" className="min-w-0" onClick={closeOnMobile}>
            <span className="app-kicker block">SLCDM</span>
            <span className="font-display text-base font-extrabold tracking-display text-text-on-dark">
              Dispositivos
            </span>
          </NavLink>
          <button
            type="button"
            className="app-icon-btn app-icon-btn--on-dark"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Módulos del sistema" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.filter((item) => isVisibleToRol(item, rol)).map((item) => {
              if (item.type === 'group') {
                const children = item.children.filter((child) => isVisibleToRol(child, rol));
                if (!children.length) return null;
                return (
                  <li key={item.label} className="pt-3">
                    <p className="app-nav-group">
                      <i className={item.icon} aria-hidden="true" />
                      {item.label}
                    </p>
                    <ul className="space-y-0.5">
                      {children.map((child) => (
                        <li key={child.path}>
                          {child.disabled ? (
                            <DisabledNavItem icon={child.icon} label={child.label} />
                          ) : (
                            <NavLink to={child.path} className={linkClass} onClick={closeOnMobile}>
                              <NavItemContent icon={child.icon} label={child.label} />
                            </NavLink>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  {item.disabled ? (
                    <DisabledNavItem icon={item.icon} label={item.label} />
                  ) : (
                    <NavLink
                      to={item.path}
                      end={item.path === '/app'}
                      className={linkClass}
                      onClick={closeOnMobile}
                    >
                      <NavItemContent icon={item.icon} label={item.label} />
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="app-sidebar-foot">
          <ThemeToggle inverse />
        </div>
      </div>
    </aside>
  );
}
