/**
 * @param {object} props
 * @param {'primary' | 'secondary' | 'danger'} [props.variant]
 * @param {'button' | 'submit'} [props.type]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 * @param {() => void} [props.onClick]
 */
export function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  onClick,
}) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    secondary: 'border border-line bg-surface-raised text-ink hover:bg-surface',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
