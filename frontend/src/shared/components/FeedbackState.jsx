const STATUS_STYLES = {
  loading: 'border-border bg-lavender text-text-muted',
  error: 'border-error/30 bg-error-soft text-error',
  empty: 'border-border bg-lavender text-text-muted',
};

export function FeedbackState({
  status,
  loadingMessage = 'Cargando...',
  errorMessage = 'Ocurrió un error al procesar la solicitud.',
  emptyMessage = 'No hay datos para mostrar.',
  children,
}) {
  if (status === 'idle' || status === 'loading') {
    return (
      <div role="status" className={`rounded-md border px-4 py-3 text-sm ${STATUS_STYLES.loading}`}>
        {loadingMessage}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div role="alert" className={`rounded-md border px-4 py-3 text-sm ${STATUS_STYLES.error}`}>
        {errorMessage}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className={`rounded-md border px-4 py-3 text-sm ${STATUS_STYLES.empty}`}>
        {emptyMessage}
      </div>
    );
  }

  return children ?? null;
}
