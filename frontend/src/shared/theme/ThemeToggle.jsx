import { useSyncExternalStore } from 'react';
import { getTheme, subscribeTheme, toggleTheme } from '@/shared/theme/theme';

export function ThemeToggle({ inverse = false }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light');
  const nextLabel = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      className={`theme-toggle${inverse ? ' theme-toggle--inverse' : ''}`}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <i className={theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'} aria-hidden="true" />
    </button>
  );
}
