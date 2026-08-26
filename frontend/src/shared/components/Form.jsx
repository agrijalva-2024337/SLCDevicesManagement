import { ErrorBanner } from '@/shared/components/ErrorBanner';

/**
 * Wrapper de formulario. La lógica de negocio vive en la página, no aquí.
 *
 * @param {object} props
 * @param {(event: import('react').FormEvent) => void} props.onSubmit
 * @param {string} [props.error] Error general del formulario (no de campo).
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function Form({ onSubmit, error, className = '', children }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(event);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-4 ${className}`}>
      <ErrorBanner message={error} />
      {children}
    </form>
  );
}

export const inputClassName =
  'w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

/**
 * Campo con etiqueta y error por campo.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.htmlFor]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {import('react').ReactNode} props.children
 */
export function FormField({ label, htmlFor, error, hint, children }) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
