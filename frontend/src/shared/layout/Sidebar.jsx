import { NavLink } from 'react-router';
import { navigation } from '@/shared/layout/navigation';

function linkClass({ isActive }) {
  const base = 'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors';

  if (isActive) {
    return `${base} bg-accent text-white`;
  }

  return `${base} text-text-on-dark-muted hover:bg-navy-mid hover:text-text-on-dark`;
}

export function Sidebar({ open, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-navy/50 lg:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
        aria-label="Cerrar menú de navegación"
      />

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] flex-col bg-navy text-text-on-dark transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[var(--header-height)] items-center border-b border-border-on-dark px-5">
          <NavLink
            to="/app"
            className="font-display text-lg font-extrabold tracking-display text-text-on-dark"
            onClick={onClose}
          >
            SLCDM
          </NavLink>
        </div>

        <nav aria-label="Módulos del sistema" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              if (item.type === 'group') {
                return (
                  <li key={item.label} className="pt-3">
                    <p className="mb-1 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-on-dark-muted">
                      <i className={item.icon} aria-hidden="true" />
                      {item.label}
                    </p>
                    <ul className="space-y-0.5">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink to={child.path} className={linkClass} onClick={onClose}>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/app'}
                    className={linkClass}
                    onClick={onClose}
                  >
                    <i className={item.icon} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
