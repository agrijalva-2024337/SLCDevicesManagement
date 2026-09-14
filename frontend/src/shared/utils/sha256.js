/**
 * Utilidades SHA-256 del frontend (Web Crypto).
 *
 * Uso previsto:
 * - Huella local de archivos/texto en el cliente.
 * - Normalizar y comparar hex de 64 chars de forma uniforme en toda la UI.
 *
 * Nota: la integridad oficial del acta PDF en API es HMAC-SHA256 con pepper
 * (servidor). Aquí no se replica el pepper; la verificación real va al backend.
 */

const HEX64 = /^[0-9a-f]{64}$/;

function requireSubtle() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle?.digest) {
    throw new Error('Web Crypto (SHA-256) no está disponible en este entorno.');
  }
  return subtle;
}

function toArrayBuffer(source) {
  if (source == null) {
    throw new Error('No hay datos para hashear.');
  }

  if (source instanceof ArrayBuffer) {
    return source.byteLength > 0 ? source : null;
  }

  if (ArrayBuffer.isView(source)) {
    if (source.byteLength === 0) return null;
    return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  }

  throw new Error('El contenido a hashear debe ser ArrayBuffer o TypedArray.');
}

/** Quita espacios, prefijo 0x y pasa a minúsculas. */
export function normalizeSha256Hex(value) {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase().replace(/^0x/, '').replace(/\s+/g, '');
  return raw || null;
}

/** True si el valor es un digest SHA-256 hex de 64 caracteres. */
export function isSha256Hex(value) {
  const normalized = normalizeSha256Hex(value);
  return Boolean(normalized && HEX64.test(normalized));
}

/**
 * Comparación en tiempo constante (best-effort en JS) de dos hex SHA-256.
 * Retorna false si alguno no es un digest hex válido de 64 chars.
 */
export function hashesEqual(left, right) {
  const a = normalizeSha256Hex(left);
  const b = normalizeSha256Hex(right);
  if (!a || !b || !HEX64.test(a) || !HEX64.test(b)) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < 64; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Digest SHA-256 → hex minúscula (64 chars). */
export async function sha256Hex(source) {
  const subtle = requireSubtle();
  const buffer = toArrayBuffer(source);
  if (!buffer) {
    throw new Error('No se puede calcular SHA-256 de un contenido vacío.');
  }

  const digest = await subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 de un File/Blob (p. ej. PDF de verificación). */
export async function sha256File(file) {
  if (!(file instanceof Blob)) {
    throw new Error('Se esperaba un archivo (File/Blob) para hashear.');
  }
  if (file.size === 0) {
    throw new Error('El archivo está vacío; no se calcula SHA-256.');
  }
  return sha256Hex(await file.arrayBuffer());
}

/** SHA-256 de texto UTF-8. */
export async function sha256Text(text) {
  if (text == null || String(text).length === 0) {
    throw new Error('El texto a hashear no puede estar vacío.');
  }
  return sha256Hex(new TextEncoder().encode(String(text)));
}

/** Presentación en UI (hex normalizado o guión). */
export function formatHash(value) {
  const normalized = normalizeSha256Hex(value);
  return normalized || '—';
}
