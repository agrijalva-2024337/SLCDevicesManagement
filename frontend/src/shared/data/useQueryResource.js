import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuery, getQueryData, invalidateQueries, serializeQueryKey, subscribe } from '@/shared/data/queryCache';
import { getLoaderQueryKey } from '@/shared/data/loaderKeys';
import { ttlForKey } from '@/shared/data/queryKeys';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

const EMPTY_LIST = Object.freeze([]);

/** Reusa la misma referencia de arreglo mientras la clave serializada no cambie. */
const keyIdentityByStr = new Map();

function stableResolvedKey(resolved) {
  if (!resolved) {
    return undefined;
  }
  const keyStr = serializeQueryKey(resolved);
  const cached = keyIdentityByStr.get(keyStr);
  if (cached) {
    return cached;
  }
  keyIdentityByStr.set(keyStr, resolved);
  return resolved;
}

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

export function useQueryResource(loadFn, { key, ttlMs, enabled = true, initialData = EMPTY_LIST } = {}) {
  const resolvedKey = stableResolvedKey(resolveKey(loadFn, key));
  const keyStr = resolvedKey ? serializeQueryKey(resolvedKey) : '';
  const ttl = useMemo(
    () => ttlMs ?? (resolvedKey ? ttlForKey(resolvedKey) : 30_000),
    [resolvedKey, ttlMs],
  );

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
  const initialDataRef = useRef(initialData);
  const enabledRef = useRef(enabled);
  const resolvedKeyRef = useRef(resolvedKey);
  const ttlRef = useRef(ttl);
  const cancelRef = useRef(false);

  useEffect(() => {
    loadFnRef.current = loadFn;
  }, [loadFn]);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    resolvedKeyRef.current = resolvedKey;
  }, [resolvedKey]);

  useEffect(() => {
    ttlRef.current = ttl;
  }, [ttl]);

  // Al cambiar de clave (p. ej. slug de catálogo), no arrastrar filas del recurso anterior.
  useEffect(() => {
    const currentKey = resolvedKey;
    if (!currentKey) {
      setData(initialDataRef.current);
      setIsLoading(Boolean(enabled));
      setErrorMessage(null);
      return;
    }
    const cached = getQueryData(currentKey);
    if (cached !== undefined) {
      setData(cached);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }
    setData(initialDataRef.current);
    setIsLoading(Boolean(enabled));
    setErrorMessage(null);
  }, [enabled, keyStr, resolvedKey]);

  const run = useCallback(async ({ force = false, signal } = {}) => {
    if (!enabledRef.current) {
      return initialDataRef.current;
    }

    const currentFn = loadFnRef.current;
    const currentKey = resolvedKeyRef.current;
    const currentTtl = ttlRef.current;
    const fallback = initialDataRef.current;

    try {
      let result;
      if (!currentKey) {
        result = await currentFn();
      } else {
        result = await fetchQuery(currentKey, () => currentFn(), {
          ttlMs: force ? 0 : currentTtl,
          signal,
        });
      }

      const next = result === undefined ? fallback : result;
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
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;
    cancelRef.current = false;
    const currentKey = resolvedKeyRef.current;

    async function load() {
      const cached = currentKey ? getQueryData(currentKey) : undefined;
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

    const unsubscribe = currentKey
      ? subscribe(currentKey, (value, entry) => {
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
    // Solo enabled + keyStr: resolvedKey/run son estables o se leen de refs.
  }, [enabled, keyStr, run]);

  const reload = useCallback(async () => {
    const currentKey = resolvedKeyRef.current;
    if (currentKey) {
      invalidateQueries(currentKey);
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
  }, [run]);

  return { data, isLoading, errorMessage, reload };
}
