import { useToast } from '@/shared/feedback/useToast';

const TYPE_STYLES = {
  error: 'border-danger bg-danger-soft text-danger',
  success: 'border-success bg-success-soft text-success',
  info: 'border-line bg-surface-raised text-ink',
};

export function ToastHost() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className="text-xs font-medium underline underline-offset-2"
              onClick={() => dismiss(toast.id)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
