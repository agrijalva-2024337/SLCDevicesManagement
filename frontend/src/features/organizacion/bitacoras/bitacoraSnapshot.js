function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseBitacoraSnapshot(value) {
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    if (text.includes('=') && (text.includes(';') || text.includes(','))) {
      const pairs = text
        .split(/[;,]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const index = part.indexOf('=');
          if (index <= 0) {
            return null;
          }
          return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
        })
        .filter(Boolean);
      if (pairs.length > 0) {
        return Object.fromEntries(pairs);
      }
    }
    return text;
  }
}

export function formatSnapshotValue(value) {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function snapshotEntries(value) {
  const parsed = parseBitacoraSnapshot(value);
  if (parsed == null) {
    return [];
  }
  if (isPlainObject(parsed)) {
    return Object.entries(parsed).map(([key, item]) => [key, formatSnapshotValue(item)]);
  }
  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => [String(index + 1), formatSnapshotValue(item)]);
  }
  return [['Valor', formatSnapshotValue(parsed)]];
}
