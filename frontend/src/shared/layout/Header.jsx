import { useAuth } from '@/shared/auth/useAuth';
import { ROLE_LABELS } from '@/shared/auth/authRoles';

/**
 * @param {object} props
 * @param {() => void} props.onMenuClick
 */
export function Header({ onMenuClick }) {
  const { role, setSimulatedRole } = useAuth();

  return (
    <header className="flex h-header items-center justify-between gap-4 border-b border-line bg-surface-raised px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-line px-2 py-1 text-sm text-ink lg:hidden"
          onClick={onMenuClick}
        >
          Menú
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">SLC</p>
          <p className="text-sm font-semibold text-ink">SLCDevicesManagement</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-muted">
        Perfil simulado
        <select
          className="rounded-md border border-line bg-surface-raised px-2 py-1 text-sm text-ink"
          value={role ?? ''}
          onChange={(event) => setSimulatedRole(event.target.value || null)}
        >
          <option value="">Sin sesión</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}
