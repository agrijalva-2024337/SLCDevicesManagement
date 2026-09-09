import { foldSearch } from '@/shared/utils/search';

/**
 * Catálogo local ISO 3166 + rangos de dígitos nacionales (FE-19).
 * Sin dependencia de libphonenumber-js: solo países de operación real.
 */
export const PAISES_ISO = Object.freeze([
  {
    nombre: 'Guatemala',
    codigoIso2: 'gt',
    codigoIso3: 'gtm',
    codigoTelefonico: '+502',
    digitos: { min: 8, max: 8 },
  },
  {
    nombre: 'Belice',
    codigoIso2: 'bz',
    codigoIso3: 'blz',
    codigoTelefonico: '+501',
    digitos: { min: 7, max: 7 },
  },
  {
    nombre: 'El Salvador',
    codigoIso2: 'sv',
    codigoIso3: 'slv',
    codigoTelefonico: '+503',
    digitos: { min: 8, max: 8 },
  },
  {
    nombre: 'Honduras',
    codigoIso2: 'hn',
    codigoIso3: 'hnd',
    codigoTelefonico: '+504',
    digitos: { min: 8, max: 8 },
  },
  {
    nombre: 'Nicaragua',
    codigoIso2: 'ni',
    codigoIso3: 'nic',
    codigoTelefonico: '+505',
    digitos: { min: 8, max: 8 },
  },
  {
    nombre: 'Costa Rica',
    codigoIso2: 'cr',
    codigoIso3: 'cri',
    codigoTelefonico: '+506',
    digitos: { min: 8, max: 8 },
  },
  {
    nombre: 'Panamá',
    codigoIso2: 'pa',
    codigoIso3: 'pan',
    codigoTelefonico: '+507',
    digitos: { min: 7, max: 8 },
  },
  {
    nombre: 'México',
    codigoIso2: 'mx',
    codigoIso3: 'mex',
    codigoTelefonico: '+52',
    digitos: { min: 10, max: 10 },
  },
  {
    nombre: 'Estados Unidos',
    codigoIso2: 'us',
    codigoIso3: 'usa',
    codigoTelefonico: '+1',
    digitos: { min: 10, max: 10 },
  },
  {
    nombre: 'Colombia',
    codigoIso2: 'co',
    codigoIso3: 'col',
    codigoTelefonico: '+57',
    digitos: { min: 10, max: 10 },
  },
]);

function normalizeDial(code) {
  const digits = String(code ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function scoreNombre(pais, query) {
  const folded = foldSearch(pais.nombre);
  const needle = foldSearch(query);
  if (!needle) return 0;
  if (folded === needle) return 100;
  if (folded.startsWith(needle)) return 80;
  if (folded.includes(needle)) return 60;
  const tokens = needle.split(/\s+/);
  if (tokens.every((t) => folded.includes(t))) return 40;
  return 0;
}

export function buscarPorNombre(nombre) {
  const text = String(nombre ?? '').trim();
  if (!text) return null;
  let best = null;
  let bestScore = 0;
  for (const pais of PAISES_ISO) {
    const score = scoreNombre(pais, text);
    if (score > bestScore) {
      best = pais;
      bestScore = score;
    }
  }
  return bestScore >= 60 ? best : null;
}

export function sugerirPorNombre(nombre, limit = 3) {
  const text = String(nombre ?? '').trim();
  if (!text) return [];
  return PAISES_ISO.map((pais) => ({ pais, score: scoreNombre(pais, text) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.pais.nombre.localeCompare(b.pais.nombre, 'es'))
    .slice(0, limit)
    .map((row) => row.pais);
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

export function buscarPorCodigoTelefonico(codigo) {
  const dial = normalizeDial(codigo);
  if (!dial) return null;
  return PAISES_ISO.find((pais) => normalizeDial(pais.codigoTelefonico) === dial) ?? null;
}

export function iso2Conocido(codigo) {
  return Boolean(buscarPorIso2(codigo));
}
