import { useEffect } from 'react';

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Modal genérico: confirmación, formulario embebido o contenido libre.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {import('react').ReactNode} [props.footer]
 * @param {import('react').ReactNode} props.children
 */
export function Modal({ open, onClose, title, size = 'md', footer, children }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative z-10 w-full rounded-md border border-line bg-surface-raised shadow-lg ${SIZE_CLASS[size] || SIZE_CLASS.md}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          {title ? (
            <h2 id="modal-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button type="button" className="text-sm text-ink-muted hover:text-ink" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
