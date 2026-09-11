import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function DetailOverlay({
  open,
  title,
  kicker = 'Ficha',
  badge,
  onClose,
  children,
  variant = 'default',
  size = 'default',
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = variant === 'success';
  const overlayClass = [
    'app-overlay',
    isSuccess ? 'app-overlay--success' : '',
    size === 'confirm' ? 'app-overlay--confirm' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-navy/55 backdrop-blur-md"
        aria-label="Cerrar ficha"
        onClick={onClose}
      />
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-overlay-title"
        className={overlayClass}
      >
        {isSuccess ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="app-icon-btn app-overlay-success-close"
              aria-label="Cerrar"
            >
              <i className="pi pi-times" aria-hidden="true" />
            </button>
            <div className="app-overlay-body app-overlay-body--success">
              <h2 id="detail-overlay-title" className="sr-only">
                {title}
              </h2>
              {children}
            </div>
          </>
        ) : (
          <>
            <header className="app-overlay-head">
              <div className="relative z-[1] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="app-kicker">{kicker}</p>
                  <h2
                    id="detail-overlay-title"
                    className="mt-2 break-words font-display text-2xl font-bold tracking-tight sm:text-3xl"
                  >
                    {title}
                  </h2>
                  {badge ? <div className="mt-3">{badge}</div> : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="app-icon-btn app-icon-btn--on-dark"
                  aria-label="Cerrar"
                >
                  <i className="pi pi-times" aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="app-overlay-body space-y-6">{children}</div>
          </>
        )}
      </article>
    </div>,
    document.body,
  );
}

export function SaveFlash({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="app-feedback app-feedback--success" role="status">
      {message}
    </div>
  );
}

export function DetailField({ label, value }) {
  return (
    <div className="app-field">
      <p className="app-field-label">{label}</p>
      <div className="app-field-value">{value || '—'}</div>
    </div>
  );
}
