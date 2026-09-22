const DATE_FORMAT = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-GT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const moneyFormats = new Map();

export function formatDate(value) {
  if (!value) return '—';
  return DATE_FORMAT.format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return DATE_TIME_FORMAT.format(new Date(value));
}

export function formatMoney(value, currency = 'GTQ') {
  let format = moneyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    moneyFormats.set(currency, format);
  }
  return format.format(value);
}

const idIndex = new WeakMap();

function indexById(list) {
  let map = idIndex.get(list);
  if (map) return map;

  map = new Map();
  for (const item of list) {
    if (!item || item.id == null || item.id === '') continue;
    const key = Number(item.id);
    if (!Number.isFinite(key) || map.has(key)) continue;
    map.set(key, item);
  }
  idIndex.set(list, map);
  return map;
}

export function byId(list, id) {
  if (!Array.isArray(list) || id == null || id === '') return undefined;
  const key = Number(id);
  if (!Number.isFinite(key)) return undefined;
  return indexById(list).get(key);
}
