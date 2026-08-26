type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="self-start rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
