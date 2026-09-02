import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function DetailOverlay({ open, title, kicker = 'Ficha', badge, onClose, children }) {
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

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-navy/55 backdrop-blur-md"
        aria-label="Cerrar ficha"
        onClick={onClose}
      />
      <article role="dialog" aria-modal="true" aria-labelledby="detail-overlay-title" className="app-overlay">
        <header className="app-overlay-head">
          <div className="relative z-[1] flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="app-kicker">{kicker}</p>
              <h2
                id="detail-overlay-title"
                className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl"
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
      </article>
    </div>,
    document.body,
  );
}

export function DetailField({ label, value }) {
  return (
    <div className="app-field">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <div className="mt-1 text-base font-semibold text-navy">{value || '—'}</div>
    </div>
  );
}
