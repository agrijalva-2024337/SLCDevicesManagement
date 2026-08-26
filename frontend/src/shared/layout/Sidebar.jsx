import { NavLink } from 'react-router-dom';
import { canAccess } from '@/shared/auth/authRoles';
import { useAuth } from '@/shared/auth/useAuth';
import { filterNavItems, NAV_ITEMS } from '@/shared/layout/navigation';

function linkClass({ isActive }) {
  return `block rounded-md px-3 py-2 text-sm ${
    isActive
      ? 'bg-sidebar-active text-white'
      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
  }`;
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export function Sidebar({ open, onClose }) {
  const { role } = useAuth();
  const items = filterNavItems(NAV_ITEMS, role, canAccess);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-20 bg-ink/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-sidebar flex-col bg-sidebar pt-header transition-transform lg:static lg:translate-x-0 lg:pt-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id}>
                {item.children ? (
                  <div>
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
                      {item.label}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <NavLink to={child.path} className={linkClass} onClick={onClose} end>
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={linkClass}
                    onClick={onClose}
                    end={item.path === '/'}
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
