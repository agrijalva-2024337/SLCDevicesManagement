export function FeedbackState({
  status,
  loadingMessage = 'Cargando...',
  errorMessage = 'Ocurrió un error al procesar la solicitud.',
  emptyMessage = 'No hay datos para mostrar.',
  children,
}) {
  if (status === 'idle' || status === 'loading') {
    return (
      <div role="status" className="app-feedback app-feedback--loading">
        {loadingMessage}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div role="alert" className="app-feedback app-feedback--error">
        {errorMessage}
      </div>
    );
  }

  if (status === 'empty') {
    return <div className="app-feedback app-feedback--empty">{emptyMessage}</div>;
  }

  return children ?? null;
}
