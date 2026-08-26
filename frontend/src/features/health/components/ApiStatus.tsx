import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useAsync } from '@/shared/hooks/useAsync';
import { getHealth } from '../api/healthApi';

export function ApiStatus() {
  const { data, error, isLoading, isError, reload } = useAsync(getHealth);

  if (isLoading) {
    return <LoadingState message="Comprobando el cliente HTTP…" />;
  }

  if (isError) {
    return (
      <ErrorState message={error ?? 'No se pudo verificar el cliente HTTP.'} onRetry={reload} />
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p className="font-medium">Cliente Axios listo</p>
      <p className="mt-1 text-emerald-800">
        Origen: {data?.source} · {data?.message}
      </p>
    </div>
  );
}
