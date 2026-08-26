/**
 * @param {object} props
 * @param {'sm' | 'md'} [props.size]
 * @param {string} [props.className]
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4';

  return (
    <span
      role="status"
      aria-label="Cargando"
      className={`inline-block animate-spin rounded-full border-line border-t-brand ${sizeClass} ${className}`}
    />
  );
}
