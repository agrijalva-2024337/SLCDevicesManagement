import { DetailOverlay } from '@/shared/components/DetailOverlay';

/**
 * Confirmación modal al estilo de la app (reemplaza window.confirm).
 */
export function ConfirmDialog({
  open,
  title,
  kicker = 'Confirmación',
  children,
  confirmLabel = 'Confirmar',
  confirmingLabel,
  cancelLabel = 'Cancelar',
  confirming = false,
  error = null,
  onConfirm,
  onClose,
  tone = 'danger',
  confirmIcon = 'pi pi-trash',
}) {
  const busyLabel = confirmingLabel ?? `${confirmLabel.replace(/…$/, '')}…`;
  const confirmClass = tone === 'danger' ? 'app-btn app-btn--danger' : 'app-btn app-btn--primary';

  return (
    <DetailOverlay
      open={open}
      title={title}
      kicker={kicker}
      size="confirm"
      onClose={() => {
        if (confirming) return;
        onClose?.();
      }}
    >
      {children ? <div className="text-base text-navy">{children}</div> : null}

      {error ? (
        <div className="app-feedback app-feedback--error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={confirmClass} disabled={confirming} onClick={onConfirm}>
          {confirmIcon ? <i className={confirmIcon} aria-hidden="true" /> : null}
          {confirming ? busyLabel : confirmLabel}
        </button>
        <button
          type="button"
          className="app-btn app-btn--ghost"
          disabled={confirming}
          onClick={() => {
            if (confirming) return;
            onClose?.();
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </DetailOverlay>
  );
}
