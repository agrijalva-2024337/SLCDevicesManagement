export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatMoney(value, currency = 'GTQ') {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function byId(list, id) {
  return list.find((item) => item.id === Number(id));
}
