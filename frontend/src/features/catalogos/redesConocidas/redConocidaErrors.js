import { applyApiFieldErrors } from '@/shared/utils/fieldErrors';

export const BSSID_DUPLICADO = 'Ese BSSID ya está registrado';

function rawErrorText(error) {
  return [
    error?.response?.data?.detail,
    error?.response?.data?.title,
    error?.response?.data?.message,
    error?.message,
    error?.fieldErrors?.bssid,
  ]
    .filter(Boolean)
    .join(' ');
}

export function isDuplicateBssidError(error) {
  const status = error?.response?.status ?? error?.status;
  if (status === 409) return true;
  return /unique|duplicad|constraint|ix_|bssid/i.test(rawErrorText(error));
}

export function toRedConocidaWriteError(error) {
  const next = applyApiFieldErrors(error);
  const status = next?.response?.status ?? next?.status;
  const looksDuplicate = isDuplicateBssidError(next) || (status === 500 && /unique|duplicad|constraint|bssid/i.test(rawErrorText(next)));
  if (!looksDuplicate && !next.fieldErrors?.bssid) {
    return next;
  }
  if (looksDuplicate) {
    next.message = BSSID_DUPLICADO;
    next.fieldErrors = { ...next.fieldErrors, bssid: BSSID_DUPLICADO };
  }
  return next;
}
