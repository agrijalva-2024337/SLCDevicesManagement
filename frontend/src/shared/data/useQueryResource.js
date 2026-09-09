import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuery, getQueryData, invalidateQueries, serializeQueryKey, subscribe } from '@/shared/data/queryCache';
import { getLoaderQueryKey } from '@/shared/data/loaderKeys';
import { ttlForKey } from '@/shared/data/queryKeys';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function isAbortError(error) {
  return Boolean(
    error?.__aborted ||
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.name === 'AbortError',
  );
}

function resolveKey(loadFn, explicitKey) {
  if (explicitKey) {
    return explicitKey;
  }
  return getLoaderQueryKey(loadFn);
}

export function useQueryResource(loadFn, { key, ttlMs, enabled = true, initialData = [] } = {}) {
  const resolvedKey = resolveKey(loadFn, key);
  const keyStr = resolvedKey ? serializeQueryKey(resolvedKey) : '';
  const ttl = ttlMs ?? (resolvedKey ? ttlForKey(resolvedKey) : 30_000);

  const [data, setData] = useState(() => {
    if (!resolvedKey) {
      return initialData;
    }
    const cached = getQueryData(resolvedKey);
    return cached === undefined ? initialData : cached;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!enabled) {
      return false;
    }
    if (!resolvedKey) {
      return true;
    }
    return getQueryData(resolvedKey) === undefined;
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const loadFnRef = useRef(loadFn);
  const cancelRef = useRef(false);
  useEffect(() => {
    loadFnRef.current = loadFn;
  }, [loadFn]);

  const run = useCallback(
    async ({ force = false, signal } = {}) => {
      if (!enabled) {
        return initialData;
      }

      const currentFn = loadFnRef.current;

      try {
        let result;
        if (!resolvedKey) {
          result = await currentFn();
        } else {
          // El AbortController compartido vive en fetchQuery; no se pasa el signal
          // del componente para no cancelar la petición de otros suscriptores.
          result = await fetchQuery(resolvedKey, () => currentFn(), {
            ttlMs: force ? 0 : ttl,
            signal,
          });
        }

        const next = result === undefined ? initialData : result;
        if (cancelRef.current || signal?.aborted) {
          return next;
        }
        setData(next);
        setErrorMessage(null);
        return next;
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) {
          throw error;
        }
        setErrorMessage(getErrorMessage(error));
        throw error;
      }
    },
    [enabled, initialData, resolvedKey, ttl],
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    cancelRef.current = false;

    async function load() {
      const cached = resolvedKey ? getQueryData(resolvedKey) : undefined;
      if (cached === undefined) {
        setIsLoading(true);
      }

      try {
        await run({ signal: controller.signal });
      } catch (error) {
        if (isAbortError(error) || cancelled || controller.signal.aborted) {
          return;
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const unsubscribe = resolvedKey
      ? subscribe(resolvedKey, (value, entry) => {
          if (cancelled) {
            return;
          }
          if (entry && entry.updatedAt === 0) {
            load();
            return;
          }
          if (value !== undefined) {
            setData(value);
            setErrorMessage(null);
            setIsLoading(false);
          }
        })
      : () => {};

    load();

    return () => {
      cancelled = true;
      cancelRef.current = true;
      controller.abort();
      unsubscribe();
    };
  }, [enabled, keyStr, resolvedKey, run]);

  const reload = useCallback(async () => {
    if (resolvedKey) {
      invalidateQueries(resolvedKey);
    }
    setIsLoading(true);
    try {
      await run({ force: true });
    } catch (error) {
      if (!isAbortError(error)) {
        /* errorMessage ya quedó en run */
      }
    } finally {
      setIsLoading(false);
    }
  }, [resolvedKey, run]);

  return { data, isLoading, errorMessage, reload };
}
