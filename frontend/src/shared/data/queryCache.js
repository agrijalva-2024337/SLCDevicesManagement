function stableSerialize(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }

  const type = typeof value;
  if (type === 'number' || type === 'boolean' || type === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }

  if (type === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(String(value));
}

export function serializeQueryKey(key) {
  return stableSerialize(key);
}

function matchesPrefix(key, prefix) {
  const prefixParts = Array.isArray(prefix) ? prefix : [prefix];
  if (!Array.isArray(key) || key.length < prefixParts.length) {
    return false;
  }

  return prefixParts.every((part, index) => stableSerialize(key[index]) === stableSerialize(part));
}

function canceledError() {
  const error = new Error('canceled');
  error.code = 'ERR_CANCELED';
  error.name = 'CanceledError';
  error.__aborted = true;
  return error;
}

const store = new Map();
const inflight = new Map();
const listeners = new Map();

const FETCH_WARN_WINDOW_MS = 5_000;
const FETCH_WARN_THRESHOLD = 10;
const fetchHitsDev = new Map();
const fetchWarnedDev = new Set();

function noteFetchInDev(keyStr) {
  if (!import.meta.env.DEV) {
    return;
  }

  const now = Date.now();
  let bucket = fetchHitsDev.get(keyStr);
  if (!bucket || now - bucket.startedAt > FETCH_WARN_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    fetchHitsDev.set(keyStr, bucket);
  }
  bucket.count += 1;

  if (bucket.count > FETCH_WARN_THRESHOLD && !fetchWarnedDev.has(keyStr)) {
    fetchWarnedDev.add(keyStr);
    console.warn(
      `[queryCache] la clave ${keyStr} se pidió ${bucket.count} veces en ${FETCH_WARN_WINDOW_MS}ms; revisá dependencias inestables en useQueryResource`,
    );
  }
}

function notify(keyStr) {
  const set = listeners.get(keyStr);
  if (!set) {
    return;
  }

  const entry = store.get(keyStr);
  for (const listener of set) {
    listener(entry?.value, entry);
  }
}

export function getQueryData(key) {
  return store.get(serializeQueryKey(key))?.value;
}

export function setQueryData(key, value) {
  const keyStr = serializeQueryKey(key);
  store.set(keyStr, { key, value, updatedAt: Date.now() });
  notify(keyStr);
}

function isFresh(entry, ttlMs) {
  if (!entry || entry.updatedAt === 0) {
    return false;
  }
  if (ttlMs == null || ttlMs === Infinity) {
    return true;
  }
  return Date.now() - entry.updatedAt < ttlMs;
}

export async function fetchQuery(key, fn, { ttlMs = 30_000, signal } = {}) {
  const keyStr = serializeQueryKey(key);
  noteFetchInDev(keyStr);
  const cached = store.get(keyStr);
  if (isFresh(cached, ttlMs)) {
    return cached.value;
  }

  let flight = inflight.get(keyStr);
  if (!flight) {
    const controller = new AbortController();
    const promise = Promise.resolve()
      .then(() => fn({ signal: controller.signal }))
      .then((value) => {
        store.set(keyStr, { key, value, updatedAt: Date.now() });
        inflight.delete(keyStr);
        notify(keyStr);
        return value;
      })
      .catch((error) => {
        inflight.delete(keyStr);
        throw error;
      });

    flight = { promise, controller, refCount: 0 };
    inflight.set(keyStr, flight);
  }

  flight.refCount += 1;

  let released = false;
  function release() {
    if (released) {
      return;
    }
    released = true;
    flight.refCount -= 1;
    // No abortar ni borrar inflight: StrictMode remonta al instante y reusa la promesa.
    // Solo clearQueryCache() aborta en masa; la promesa limpia inflight al resolver/fallar.
  }

  if (signal) {
    if (signal.aborted) {
      release();
      throw canceledError();
    }
    signal.addEventListener('abort', release, { once: true });
  }

  try {
    return await flight.promise;
  } finally {
    if (signal) {
      signal.removeEventListener('abort', release);
    }
    release();
  }
}

export function invalidateQueries(keyPrefix) {
  for (const [keyStr, entry] of store) {
    if (!matchesPrefix(entry.key, keyPrefix)) {
      continue;
    }
    store.set(keyStr, { ...entry, updatedAt: 0 });
    notify(keyStr);
  }
}

export function clearQueryCache() {
  store.clear();
  for (const flight of inflight.values()) {
    flight.controller.abort();
  }
  inflight.clear();
  for (const keyStr of [...listeners.keys()]) {
    notify(keyStr);
  }
}

export function subscribe(key, listener) {
  const keyStr = serializeQueryKey(key);
  let set = listeners.get(keyStr);
  if (!set) {
    set = new Set();
    listeners.set(keyStr, set);
  }
  set.add(listener);

  return () => {
    set.delete(listener);
    if (set.size === 0) {
      listeners.delete(keyStr);
    }
  };
}
