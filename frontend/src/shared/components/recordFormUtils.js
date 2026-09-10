export function asOptions(items, labelKey = 'nombre') {
  return (items ?? []).map((item) => ({
    value: String(item.id),
    label: item[labelKey],
    disabled: Boolean(item.disabled),
  }));
}

export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => Boolean(value)));
}

export function requireText(value, label, max) {
  const text = String(value ?? '').trim();
  if (!text) return `El campo ${label} es obligatorio.`;
  if (max && text.length > max) return `El campo ${label} no debe superar los ${max} caracteres.`;
  return null;
}

export function optionalText(value, label, max) {
  const text = String(value ?? '').trim();
  if (max && text.length > max) return `El campo ${label} no debe superar los ${max} caracteres.`;
  return null;
}

export function requireSelect(value, label) {
  if (value === '' || value == null) return `Seleccione ${label}.`;
  return null;
}

export function phoneField({
  label = 'Teléfono',
  paises = [],
  pais = null,
  maxLength = 30,
  required = false,
} = {}) {
  return {
    name: 'telefono',
    type: 'tel',
    label,
    required,
    maxLength,
    autoComplete: 'tel',
    wide: true,
    paises,
    pais,
  };
}

export {
  validarAlfanumerico,
  validarCodigoTelefonico,
  validarCorreo,
  validarCosto,
  validarIdentificacionTributaria,
  validarIso2,
  validarIso3,
  validarMarcaModelo,
  validarMoneda,
  normalizeNombreEntidad,
  validarNombreEntidad,
  validarNombrePersona,
  validarPassword,
  validarTelefono,
  validarTextoLibre,
  validarUsername,
} from '@/shared/validation/validators';
