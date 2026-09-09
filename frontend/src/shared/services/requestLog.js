function stableParams(params) {
  if (params == null || typeof params !== 'object') {
    return '';
  }

  const keys = Object.keys(params).sort();
  if (keys.length === 0) {
    return '';
  }

  const sorted = {};
  for (const key of keys) {
    sorted[key] = params[key];
  }

  try {
    return JSON.stringify(sorted);
  } catch {
    return String(params);
  }
}

function requestKey(config) {
  const method = String(config?.method ?? 'get').toUpperCase();
  const url = String(config?.url ?? '');
  const params = stableParams(config?.params);
  return params ? `${method} ${url}?${params}` : `${method} ${url}`;
}

const hits = new Map();

export function recordRequest(config) {
  if (!import.meta.env.DEV) {
    return;
  }

  const key = requestKey(config);
  hits.set(key, (hits.get(key) ?? 0) + 1);
}

export function resetRequestLog() {
  hits.clear();
}

export function getRequestReport() {
  const all = [...hits.entries()].sort((left, right) => right[1] - left[1]);
  const duplicates = all.filter(([, count]) => count > 1);
  return {
    hits: Object.fromEntries(all),
    duplicates: Object.fromEntries(duplicates),
  };
}

function attachDevGlobal() {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  window.__slcRequests = {
    report() {
      const { hits: allHits, duplicates } = getRequestReport();
      const rows = Object.entries(duplicates).map(([key, count]) => ({ key, count }));
      if (rows.length === 0) {
        console.info('[slcRequests] sin duplicados', allHits);
      } else {
        console.table(rows);
      }
      return { hits: allHits, duplicates };
    },
    reset: resetRequestLog,
    dump() {
      return getRequestReport();
    },
  };
}

attachDevGlobal();
