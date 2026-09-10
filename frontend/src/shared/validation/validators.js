import {
  ALFANUMERICO,
  CODIGO_TELEFONICO,
  CORREO,
  COSTO_DECIMAL,
  IDENTIFICACION_TRIBUTARIA,
  ISO2,
  ISO3,
  MARCA_MODELO,
  MONEDA_ISO,
  NOMBRE_ENTIDAD,
  NOMBRE_PERSONA,
  PASSWORD_ALFABETO,
  PASSWORD_COMPOSICION,
  TEXTO_LIBRE,
  USERNAME,
} from '@/shared/validation/patterns';

function asText(value) {
  return String(value ?? '').trim();
}

function lengthError(label, max) {
  return `El campo ${label} no debe superar los ${max} caracteres.`;
}

function requiredError(label) {
  return `El campo ${label} es obligatorio.`;
}

function matchOrEmpty(text, pattern, message) {
  if (!text) return null;
  return pattern.test(text) ? null : message;
}

/** Colapsa espacios y hace trim (T3). */
export function normalizeNombreEntidad(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Validador reutilizable de nombre de entidad (T3).
 * Reglas: obligatorio, 3–100, al menos una letra, caracteres permitidos,
 * vocal si supera 8 caracteres.
 */
export function validarNombreEntidad(value, label = 'nombre', max = 100, { required = true } = {}) {
  const text = normalizeNombreEntidad(value);
  if (!text) return required ? requiredError(label) : null;
  if (text.length < 3) return `El ${label} debe tener al menos 3 caracteres.`;
  const limit = Math.min(max || 100, 100);
  if (text.length > limit) return lengthError(label, limit);
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text)) {
    return `El ${label} debe contener al menos una letra.`;
  }
  if (!NOMBRE_ENTIDAD.test(text)) {
    return `El ${label} solo admite letras, números, espacios y los signos . , - _ & / ( ) ' ―`;
  }
  if (text.length > 8 && !/[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/.test(text)) {
    return `El ${label} debe incluir al menos una vocal cuando supera 8 caracteres.`;
  }
  return null;
}

export function validarNombrePersona(value, label, max, { required = true } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  return matchOrEmpty(
    text,
    NOMBRE_PERSONA,
    `El ${label} solo admite letras, espacios, guion y apóstrofo (sin números)`,
  );
}

export function validarTextoLibre(value, label, max, { required = false } = {}) {
  const text = String(value ?? '');
  const trimmed = text.trim();
  if (!trimmed) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  return matchOrEmpty(
    text,
    TEXTO_LIBRE,
    `El ${label} no admite los caracteres < > { } \\ | \` ~ ^`,
  );
}

export function validarAlfanumerico(value, label, max, { required = false } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  return matchOrEmpty(
    text,
    ALFANUMERICO,
    `El ${label} solo admite letras, números y guion (sin espacios)`,
  );
}

export function validarMarcaModelo(value, label, max, { required = false } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  return matchOrEmpty(
    text,
    MARCA_MODELO,
    `El ${label} solo admite letras, números, espacios, guion y punto`,
  );
}

export function validarUsername(value, label = 'usuario', max = 50, { required = true } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  if (text.length < 3) return `El ${label} debe tener al menos 3 caracteres.`;
  return matchOrEmpty(
    text,
    USERNAME,
    `El ${label} solo admite minúsculas, números, punto, guion y guion bajo; debe empezar con letra`,
  );
}

export function validarCorreo(value, label = 'correo', max = 150, { required = false } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (max && text.length > max) return lengthError(label, max);
  return matchOrEmpty(
    text,
    CORREO,
    `El ${label} no tiene un formato válido (ej. nombre@empresa.com.gt)`,
  );
}

export function validarPassword(value, label = 'contraseña', { required = true } = {}) {
  const text = String(value ?? '');
  if (!text) return required ? requiredError(label) : null;
  if (text.length < 8 || text.length > 128) {
    return `La ${label} debe tener entre 8 y 128 caracteres.`;
  }
  if (!PASSWORD_ALFABETO.test(text)) {
    return `La ${label} solo admite letras, números y los símbolos ! @ # $ % & * ?`;
  }
  if (!PASSWORD_COMPOSICION.test(text)) {
    return `La ${label} debe incluir mayúscula, minúscula, dígito y un símbolo (!@#$%&*?)`;
  }
  return null;
}

export function validarIdentificacionTributaria(
  value,
  label = 'identificación tributaria',
  max = 20,
  { required = true } = {},
) {
  const text = asText(value).toUpperCase();
  if (!text) return required ? requiredError(label) : null;
  const limit = Math.min(max || 20, 20);
  if (text.length < 5 || text.length > limit || !IDENTIFICACION_TRIBUTARIA.test(text)) {
    return `La ${label} solo admite letras, números y guiones (5 a 20 caracteres).`;
  }
  return null;
}

export function validarCosto(value, label = 'costo', { required = false } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (!COSTO_DECIMAL.test(text)) {
    return `El ${label} admite hasta 10 enteros y 2 decimales con punto (máx. 9999999999.99)`;
  }
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 9_999_999_999.99) {
    return `El ${label} debe estar entre 0 y 9999999999.99`;
  }
  return null;
}

export function validarMoneda(value, label = 'moneda', { required = false } = {}) {
  const text = asText(value).toUpperCase();
  if (!text) return required ? requiredError(label) : null;
  if (text.length > 10) return lengthError(label, 10);
  return matchOrEmpty(text, MONEDA_ISO, `La ${label} debe ser un código ISO de 3 letras (ej. GTQ)`);
}

export function validarIso2(value, label = 'ISO-2', { required = true } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  return matchOrEmpty(text, ISO2, `El ${label} debe tener exactamente 2 letras`);
}

export function validarIso3(value, label = 'ISO-3', { required = true } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  return matchOrEmpty(text, ISO3, `El ${label} debe tener exactamente 3 letras`);
}

export function validarCodigoTelefonico(value, label = 'código telefónico', { required = false } = {}) {
  const text = asText(value);
  if (!text) return required ? requiredError(label) : null;
  if (text.length > 5) return lengthError(label, 5);
  return matchOrEmpty(
    text,
    CODIGO_TELEFONICO,
    `El ${label} admite + opcional y hasta 5 dígitos`,
  );
}

/**
 * Teléfono: normaliza quitando espacios/guiones/paréntesis.
 * Con `pais.digitos` valida el rango nacional; si no, E.164 (7–15).
 */
export function validarTelefono(value, { pais, label = 'teléfono', required = false } = {}) {
  const raw = String(value ?? '');
  const digits = raw.replace(/[\s\-().]/g, '');
  if (!digits) return required ? requiredError(label) : null;
  if (!/^[0-9]+$/.test(digits)) {
    return `El ${label} solo admite dígitos (puede incluir espacios, guiones o paréntesis)`;
  }
  if (digits.length > 30) return lengthError(label, 30);

  const min = pais?.digitos?.min ?? 7;
  const max = pais?.digitos?.max ?? 15;
  const nombrePais = pais?.nombre;

  if (digits.length < min || digits.length > max) {
    if (nombrePais && pais?.digitos) {
      if (min === max) {
        return `Un teléfono de ${nombrePais} tiene ${min} dígitos`;
      }
      return `Un teléfono de ${nombrePais} tiene entre ${min} y ${max} dígitos`;
    }
    return `El ${label} debe tener entre ${min} y ${max} dígitos`;
  }
  return null;
}
