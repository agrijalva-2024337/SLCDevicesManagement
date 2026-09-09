/**
 * Prueba mínima (sin runner) de claves de catálogo.
 * Ejecutar: `node src/shared/data/catalogListQueryKey.check.js` desde frontend/
 */
import { catalogListQueryKey } from './queryKeys.js';
import { serializeQueryKey } from './queryCache.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const estados = serializeQueryKey(catalogListQueryKey('estados'));
const paises = serializeQueryKey(catalogListQueryKey('paises'));
const usuariosFiltrado = serializeQueryKey(catalogListQueryKey('usuarios', { idEmpresa: 1 }));
const usuariosTodos = serializeQueryKey(catalogListQueryKey('usuarios'));

assert(estados !== paises, 'estados y paises deben tener key distinta');
assert(estados.includes('estados'), 'key de estados debe nombrar el resource');
assert(paises.includes('paises'), 'key de paises debe nombrar el resource');
assert(usuariosFiltrado !== usuariosTodos, 'usuarios con idEmpresa debe distinguir params');
assert(
  serializeQueryKey(catalogListQueryKey('estados')) === estados,
  'misma key serializada para el mismo slug',
);

console.log('catalogListQueryKey.check.js: ok');
