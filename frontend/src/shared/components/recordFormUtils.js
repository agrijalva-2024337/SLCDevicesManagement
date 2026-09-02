export function asOptions(items, labelKey = 'nombre') {
  return items.map((item) => ({ value: String(item.id), label: item[labelKey] }));
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
