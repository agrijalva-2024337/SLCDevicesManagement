import { foldSearch } from '@/shared/utils/search';
import { PAISES_ISO_ROWS } from '@/shared/validation/paisesIso.data';

/**
 * Catálogo ISO 3166 mundial (español) + rangos de dígitos nacionales.
 * Sin libphonenumber-js. Fuente: paisesIso.data.js (~230 países).
 */
export const PAISES_ISO = Object.freeze(PAISES_ISO_ROWS.map((row) => Object.freeze({ ...row })));

const ALIASES = Object.freeze({
  chile: 'cl',
  eeuu: 'us',
  usa: 'us',
  'estados unidos de america': 'us',
  uk: 'gb',
  england: 'gb',
  britain: 'gb',
  'gran bretana': 'gb',
  spain: 'es',
  mexico: 'mx',
  brasil: 'br',
  brazil: 'br',
});

function normalizeDial(code) {
  const digits = String(code ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function scoreNombre(pais, query) {
  const folded = foldSearch(pais.nombre);
  const needle = foldSearch(query);
  if (!needle) return 0;
  if (folded === needle) return 100;
  if (folded.startsWith(needle)) return 80 + Math.min(19, needle.length);
  if (folded.includes(` ${needle}`)) return 55;
  if (folded.includes(needle)) return 45;
  const tokens = needle.split(/\s+/);
  if (tokens.every((t) => folded.includes(t))) return 40;
  return 0;
}

function byAlias(nombre) {
  const key = foldSearch(nombre).replace(/\s+/g, ' ');
  const iso2 = ALIASES[key];
  return iso2 ? buscarPorIso2(iso2) : null;
}

/**
 * Mejor coincidencia por nombre.
 * Para autorrelleno (`modo: 'autofill'`): exige exacto, alias, o prefijo único (≥2 letras).
 */
export function buscarPorNombre(nombre, { modo = 'buscar' } = {}) {
  const text = String(nombre ?? '').trim();
  if (!text) return null;

  const alias = byAlias(text);
  if (alias) return alias;

  const needle = foldSearch(text);
  let best = null;
  let bestScore = 0;
  const prefixHits = [];

  for (const pais of PAISES_ISO) {
    const score = scoreNombre(pais, text);
    if (score > bestScore) {
      best = pais;
      bestScore = score;
    }
    if (foldSearch(pais.nombre).startsWith(needle) && needle.length >= 2) {
      prefixHits.push(pais);
    }
  }

  if (modo === 'autofill') {
    if (bestScore >= 100) return best;
    if (prefixHits.length === 1) return prefixHits[0];
    // Prefijo que ya es el nombre completo de un candidato (p. ej. "Chile" entre China/Chile).
    const exactPrefix = prefixHits.find((pais) => foldSearch(pais.nombre) === needle);
    return exactPrefix ?? null;
  }

  return bestScore >= 45 ? best : null;
}

export function sugerirPorNombre(nombre, limit = 8) {
  const text = String(nombre ?? '').trim();
  if (!text) return [];
  return PAISES_ISO.map((pais) => ({ pais, score: scoreNombre(pais, text) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.pais.nombre.localeCompare(b.pais.nombre, 'es'))
    .slice(0, limit)
    .map((row) => row.pais);
}

export function nombresPaisesIso() {
  return PAISES_ISO.map((pais) => pais.nombre);
}

export function buscarPorIso2(codigo) {
  const code = String(codigo ?? '')
    .trim()
    .toLowerCase();
  if (!code) return null;
  return PAISES_ISO.find((pais) => pais.codigoIso2 === code) ?? null;
}

export function buscarPorIso3(codigo) {
  const code = String(codigo ?? '')
    .trim()
    .toLowerCase();
  if (!code) return null;
  return PAISES_ISO.find((pais) => pais.codigoIso3 === code) ?? null;
}

/** Preferencia cuando un código (+1, +7, +44…) es compartido. */
const DIAL_PREFERENCE = Object.freeze({
  '+1': 'us',
  '+7': 'ru',
  '+44': 'gb',
});

export function buscarPorCodigoTelefonico(codigo) {
  const dial = normalizeDial(codigo);
  if (!dial) return null;
  const matches = PAISES_ISO.filter((pais) => normalizeDial(pais.codigoTelefonico) === dial);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  const preferred = DIAL_PREFERENCE[dial];
  return matches.find((pais) => pais.codigoIso2 === preferred) ?? matches[0];
}

export function iso2Conocido(codigo) {
  return Boolean(buscarPorIso2(codigo));
}
