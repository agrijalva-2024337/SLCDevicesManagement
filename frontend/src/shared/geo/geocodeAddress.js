const CACHE_KEY = 'slcdm.geocode.v2';
const MIN_INTERVAL_MS = 1000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota o modo privado: el Map en memoria sigue valiendo */
  }
}

const memory = new Map(Object.entries(readCache()));
let queue = Promise.resolve();
let lastRequestAt = 0;

async function throttle() {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

async function fetchNominatim(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '0',
    countrycodes: 'gt,sv,hn',
    'accept-language': 'es',
    email: 'slcdm.local@slc.example',
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;

  const rows = await response.json();
  const first = Array.isArray(rows) ? rows[0] : null;
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Geocodifica una dirección con Nominatim (OSM).
 * Caché en memoria + sessionStorage. Máximo una petición por segundo.
 * // [API] Nominatim es fallback; preferir latitud/longitud que mande el backend.
 */
export function geocodeAddress(address) {
  const query = String(address ?? '').trim();
  if (!query) return Promise.resolve(null);

  const key = query.toLowerCase();
  if (memory.has(key)) {
    return Promise.resolve(memory.get(key));
  }

  const job = queue.then(async () => {
    if (memory.has(key)) return memory.get(key);
    await throttle();
    const result = await fetchNominatim(query);
    memory.set(key, result);
    writeCache(Object.fromEntries(memory));
    return result;
  });

  queue = job.then(
    () => undefined,
    () => undefined,
  );

  return job.catch(() => null);
}
