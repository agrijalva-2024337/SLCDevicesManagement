/**
 * Patrones de validación de formato (FE-19).
 * Única fuente de regex para formularios. Angel puede copiarlos a FluentValidation.
 *
 * Alternativa de contraseña estricta (como PasswordGenerator, sin ambiguos 0/O/1/l/I):
 *   /^[abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?]+$/
 * Por decisión de producto usamos el alfabeto amplio (incluye ambiguos).
 */

/** Letras con acentos, números, espacios y signos de razón social (incluye raya tipográfica). */
export const NOMBRE_ENTIDAD =
  /^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,\-&'()/—–]+$/;
// Válido: "Sistemas Logísticos y Corporativos, S.A." / "CD Zona 12 — andén 1"
// Inválido: "Bodega #2" (el # no está permitido)
// La raya em/en (— –) se admitió porque las ubicaciones mock ya la usan como separador.

/** Solo letras con acentos, espacios, guion y apóstrofo. Sin números. */
export const NOMBRE_PERSONA =
  /^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\- ]+$/;
// Válido: "José Luis O'Neill-Pérez"
// Inválido: "Juan 3"

/** Descripciones y observaciones; rechaza caracteres tipicos de inyeccion. */
export const TEXTO_LIBRE = /^[^<>{}\\|`~^]*$/;
// Válido: "Equipo en buen estado.\nRevisar en 30 días."
// Inválido: "texto <script>"

/** Numero de serie / factura: letras, numeros y guion. Sin espacios. */
export const ALFANUMERICO = /^[A-Za-z0-9-]+$/;
// Válido: "SN-ABC123"
// Inválido: "SN ABC"

/** Username: empieza con letra; minusculas, digitos, . _ - ; 3 a 50. */
export const USERNAME = /^[a-z][a-z0-9._-]{2,49}$/;
// Válido: "j.perez_01"
// Inválido: "José"

/**
 * Correo con dominios empresariales.
 * Casos que DEBEN pasar (no usar \.[a-z]{2,3}$):
 * - contacto@empresa.tech
 * - soporte@consultora.consulting
 * - gerencia@empresa.com.gt
 * - ventas@empresa.com.mx
 * - usuario@mail.corporativo.empresa.com.gt
 * - admin@mi-empresa.com
 * - jose.luis+facturas@empresa.com
 */
export const CORREO =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

/** Alfabeto amplio de contraseña (generador + ambiguos). */
export const PASSWORD_ALFABETO = /^[A-Za-z0-9!@#$%&*?]+$/;
// Válido: "Abcd234!"
// Inválido: "Abcd 234!" (espacio)

/** Al menos una mayúscula, una minúscula, un dígito y un símbolo del alfabeto. */
export const PASSWORD_COMPOSICION =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%&*?])[A-Za-z0-9!@#$%&*?]+$/;

/** Identificación tributaria genérica: letras, dígitos y guiones. */
export const IDENTIFICACION_TRIBUTARIA = /^[A-Za-z0-9-]+$/;
// Válido: "1234567-K" / "XAXX010101000"
// Inválido: "12 345"

/** NIT guatemalteco: dígitos, guion opcional y verificador 0-9 o K. */
export const NIT_GT = /^[0-9]+-?[0-9K]$/i;
// Válido: "1234567-K"
// Inválido: "1234567-A"

/** Moneda ISO 4217 (3 letras); la columna admite hasta 10. */
export const MONEDA_ISO = /^[A-Z]{3}$/;
// Válido: "GTQ"
// Inválido: "gtq"

/** decimal(12,2): hasta 10 enteros y hasta 2 decimales; techo 9999999999.99 */
export const COSTO_DECIMAL = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
// Válido: "1250.50"
// Inválido: "1250.505"

/** Marca / modelo: alfanumérico con espacios, guion y punto. */
export const MARCA_MODELO =
  /^(?! )(?!.* $)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .-]+$/;
// Válido: "ThinkPad T14 Gen 3"
// Inválido: "HP@2530"

/** Código telefónico de país: + opcional y dígitos (máx 5 en columna). */
export const CODIGO_TELEFONICO = /^\+?[0-9]{1,5}$/;
// Válido: "+502"
// Inválido: "+50A"

/** ISO-2: exactamente 2 letras. */
export const ISO2 = /^[A-Za-z]{2}$/;
// Válido: "gt"
// Inválido: "g"

/** ISO-3: exactamente 3 letras. */
export const ISO3 = /^[A-Za-z]{3}$/;
// Válido: "gtm"
// Inválido: "gt"
