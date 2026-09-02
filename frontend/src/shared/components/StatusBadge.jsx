export function StatusBadge({
  active,
  activeLabel = 'Habilitado',
  inactiveLabel = 'Inactivo',
  tone = 'default',
}) {
  const styles = {
    default: active ? 'bg-accent-soft text-accent-text' : 'bg-lavender text-navy',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-error-soft text-error',
    info: 'bg-lavender text-navy',
  };

  const className = tone === 'default' ? styles.default : styles[tone];

  return (
    <span className={`app-badge ${className}`}>{active ? activeLabel : inactiveLabel}</span>
  );
}

export function ToneBadge({ children, tone = 'info' }) {
  const styles = {
    success: 'bg-accent-soft text-accent-text',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-error-soft text-error',
    info: 'bg-lavender text-navy',
    muted: 'bg-lavender text-navy',
  };

  return <span className={`app-badge ${styles[tone] ?? styles.info}`}>{children}</span>;
}
