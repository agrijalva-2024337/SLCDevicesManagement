import {
  buscarPorCodigoTelefonico,
  buscarPorIso2,
  buscarPorIso3,
  buscarPorNombre,
  sugerirPorNombre,
} from '@/shared/validation/paisesIso';

function changedKey(next, prev) {
  for (const key of ['nombre', 'codigoIso2', 'codigoIso3', 'codigoTelefonico']) {
    if (String(next[key] ?? '') !== String(prev?.[key] ?? '')) {
      return key;
    }
  }
  return null;
}

function matchFromField(key, values) {
  if (key === 'nombre') return buscarPorNombre(values.nombre);
  if (key === 'codigoIso2') return buscarPorIso2(values.codigoIso2);
  if (key === 'codigoIso3') return buscarPorIso3(values.codigoIso3);
  if (key === 'codigoTelefonico') return buscarPorCodigoTelefonico(values.codigoTelefonico);
  return null;
}

/** Autorrelleno bidireccional nombre ↔ ISO-2 ↔ ISO-3 ↔ código telefónico. */
export function derivePaisValues(next, prev) {
  const key = changedKey(next, prev);
  if (!key) return next;
  const match = matchFromField(key, next);
  if (!match) return next;
  return {
    ...next,
    nombre: match.nombre,
    codigoIso2: match.codigoIso2,
    codigoIso3: match.codigoIso3,
    codigoTelefonico: match.codigoTelefonico,
  };
}

export function mensajePaisDesconocido(nombre) {
  const tips = sugerirPorNombre(nombre, 3).map((pais) => pais.nombre);
  if (tips.length) {
    return `País no reconocido. ¿Quiso decir ${tips.join(', ')}?`;
  }
  return 'País no reconocido. Elija un país del catálogo ISO local.';
}
