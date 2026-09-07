import { getValidationErrors } from '@/shared/api/errors';

export function requiredError(fieldLabel) {
  return `El campo ${fieldLabel} es obligatorio`;
}

export function maxLengthError(fieldLabel, max) {
  return `El campo ${fieldLabel} no debe superar los ${max} caracteres`;
}

export function enforceRequired(errors, values, field, fieldLabel) {
  const value = values[field];
  if (value == null || String(value).trim() === '') {
    errors[field] = requiredError(fieldLabel);
  }
}

export function enforceMaxLength(errors, values, field, fieldLabel, max) {
  const value = values[field];
  if (value != null && String(value).length > max) {
    errors[field] = maxLengthError(fieldLabel, max);
  }
}

export function applyApiFieldErrors(error) {
  if (!error) return error;
  const fromApi = getValidationErrors(error);
  if (Object.keys(fromApi).length > 0) {
    error.fieldErrors = { ...fromApi, ...error.fieldErrors };
  }
  return error;
}
