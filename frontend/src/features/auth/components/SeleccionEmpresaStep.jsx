import { useEffect, useRef } from 'react';

/**
 * Paso presentacional: elegir empresa tras login (sin servicios ni navegación).
 */
export function SeleccionEmpresaStep({
  empresas = [],
  loading = false,
  error = null,
  onSelect,
  onCancel,
  onRetry,
  seleccionandoId = null,
}) {
  const firstCardRef = useRef(null);
  const busy = loading || seleccionandoId != null;

  useEffect(() => {
    if (loading || error || empresas.length === 0) {
      return;
    }
    firstCardRef.current?.focus();
  }, [loading, error, empresas.length]);

  return (
    <div className="mt-6" aria-busy={busy || undefined}>
      <h2 className="landing-auth-title text-[1.35rem]">¿Con qué empresa quieres trabajar?</h2>
      <p className="landing-auth-lead">Puedes cambiarla después desde la barra superior.</p>

      {loading ? (
        <div
          className="mt-8 flex flex-col items-center justify-center gap-3 py-10"
          role="status"
          aria-live="polite"
        >
          <i className="pi pi-spin pi-spinner text-2xl text-navy" aria-hidden="true" />
          <span className="text-sm text-[var(--color-text-muted)]">Cargando empresas…</span>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="app-feedback app-feedback--error mt-8" role="alert">
          <p>{error}</p>
          {onRetry ? (
            <button type="button" className="app-btn app-btn--secondary mt-4 w-full" onClick={onRetry}>
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && empresas.length === 0 ? (
        <div className="app-feedback app-feedback--empty mt-8" role="status">
          No hay empresas disponibles para tu usuario.
        </div>
      ) : null}

      {!loading && empresas.length > 0 ? (
        <ul
          className={`${error ? 'mt-4' : 'mt-8'} grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2`}
          role="list"
        >
          {empresas.map((empresa, index) => {
            const id = Number(empresa.id);
            const isChoosing = seleccionandoId != null && Number(seleccionandoId) === id;
            const disabled = seleccionandoId != null;

            return (
              <li key={id} role="listitem" className="min-w-0">
                <button
                  ref={index === 0 ? firstCardRef : undefined}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(id)}
                  className={[
                    'flex h-full min-h-[4.5rem] w-full items-center justify-between gap-3 rounded-2xl',
                    'border border-[color-mix(in_srgb,var(--color-navy)_12%,transparent)]',
                    'bg-[color-mix(in_srgb,var(--color-navy)_3%,white)] px-4 py-3 text-left',
                    'transition-[background,border-color,transform,box-shadow] duration-200',
                    'hover:border-[color-mix(in_srgb,var(--color-accent)_55%,transparent)]',
                    'hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,white)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                    'focus-visible:ring-offset-2 active:scale-[0.99]',
                    'disabled:cursor-wait disabled:opacity-70',
                    isChoosing
                      ? 'border-[color-mix(in_srgb,var(--color-accent)_70%,transparent)] shadow-sm'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="min-w-0 truncate font-semibold text-navy">{empresa.nombre}</span>
                  {isChoosing ? (
                    <i
                      className="pi pi-spin pi-spinner shrink-0 text-[var(--color-accent-text)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <i
                      className="pi pi-arrow-right shrink-0 text-[var(--color-text-muted)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="landing-auth-back">
        <button
          type="button"
          className="border-0 bg-transparent p-0 font-bold text-[var(--color-accent-text)] hover:text-navy"
          onClick={onCancel}
          disabled={seleccionandoId != null}
        >
          Volver al formulario
        </button>
      </p>
    </div>
  );
}
