import {
  buscarPorCodigoTelefonico,
  buscarPorIso2,
  buscarPorIso3,
  buscarPorNombre,
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

/**
 * Autorrelleno bidireccional cuando el valor coincide con la tabla local.
 * Si no hay coincidencia, deja el formulario tal cual (país nuevo permitido).
 */
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
