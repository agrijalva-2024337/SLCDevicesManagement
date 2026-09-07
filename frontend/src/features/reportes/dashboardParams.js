export const RANGE_OPTIONS = [
  { value: '7', label: '7 días', long: 'Últimos 7 días' },
  { value: '14', label: '14 días', long: 'Últimos 14 días' },
  { value: '30', label: '30 días', long: 'Últimos 30 días' },
  { value: '90', label: '90 días', long: 'Últimos 90 días' },
];

export const DEFAULT_RANGE = '30';

export const CATEGORY_ICON = {
  Laptop: 'pi-desktop',
  Monitor: 'pi-image',
  Impresora: 'pi-print',
  Red: 'pi-wifi',
  'Switch de red': 'pi-wifi',
  Servidor: 'pi-server',
  Vehículo: 'pi-car',
  Tablet: 'pi-tablet',
};

export const ENTITY_ICON = {
  Activo: 'pi-box',
  Asignacion: 'pi-user',
  HistoricoInventario: 'pi-list-check',
  Proveedor: 'pi-truck',
  Empresa: 'pi-building',
  Sede: 'pi-map-marker',
  Area: 'pi-th-large',
  Ubicacion: 'pi-map-marker',
  Pais: 'pi-globe',
};

export function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function rangeWindow(days, end = new Date()) {
  const span = Number(days) || 30;
  const endDay = new Date(end);
  endDay.setHours(23, 59, 59, 999);
  const start = new Date(endDay);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (span - 1));
  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - span);
  return { start, end: endDay, prevStart, prevEnd, days: span };
}

export function parseDashParams(params) {
  const range = RANGE_OPTIONS.some((item) => item.value === params.get('range'))
    ? params.get('range')
    : DEFAULT_RANGE;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(params.get('day') ?? '') ? params.get('day') : '';
  return {
    range,
    day,
    ops: params.get('ops') ?? '',
    est: params.get('est') ?? '',
    cat: params.get('cat') ?? '',
  };
}

export function patchSearchParams(current, patch) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '' || (key === 'range' && value === DEFAULT_RANGE)) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }
  return next;
}

export function parseOpsStack(raw) {
  if (!raw) return [];
  const parts = raw.split('/').filter(Boolean);
  const stack = [{ key: parts[0], label: parts[0] }];
  if (parts[1] === 'tipo' && parts[2]) {
    stack.push({ key: `tipo:${parts[2]}`, label: parts[2], dim: 'tipo', value: parts[2] });
  } else if (parts[1] === 'usuario' && parts[2]) {
    const usuario = decodeURIComponent(parts[2]);
    stack.push({ key: `usuario:${usuario}`, label: usuario, dim: 'usuario', value: usuario });
  }
  return stack;
}

export function serializeOpsStack(stack) {
  if (!stack.length) return '';
  const entity = stack[0].key;
  if (stack.length === 1) return entity;
  const second = stack[1];
  if (second.dim === 'tipo') return `${entity}/tipo/${second.value}`;
  if (second.dim === 'usuario') return `${entity}/usuario/${encodeURIComponent(second.value)}`;
  return entity;
}

export function parseKeyStack(raw) {
  if (!raw) return [];
  return [{ key: raw, label: raw }];
}

export function parseCategoryStack(raw) {
  if (!raw) return [];
  return [{ key: raw, label: raw }];
}
