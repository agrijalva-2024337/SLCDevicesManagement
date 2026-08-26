/**
 * Banner de error reutilizable (errores de página o de formulario).
 *
 * @param {object} props
 * @param {string} props.message
 * @param {() => void} [props.onRetry]
 */
export function ErrorBanner({ message, onRetry }) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <div className="flex items-start justify-between gap-4">
        <p>{message}</p>
        {onRetry ? (
          <button
            type="button"
            className="shrink-0 font-medium underline underline-offset-2"
            onClick={onRetry}
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
