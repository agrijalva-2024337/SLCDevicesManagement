import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/core/http/getErrorMessage';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

type AsyncState<T> = {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reload: () => void;
};

export function useAsync<T>(asyncFn: () => Promise<T>): AsyncState<T> {
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void asyncFn()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(err));
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [asyncFn, reloadKey]);

  const reload = useCallback(() => {
    setStatus('loading');
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    reload,
  };
}
