type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Cargando…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
    >
      <span
        className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-navy"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
