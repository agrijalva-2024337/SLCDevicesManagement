import { requireText } from '@/shared/components/recordFormUtils';

const BSSID_PATTERN = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;

export function normalizeBssid(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function bssidFormatError(value) {
  const required = requireText(value, 'BSSID', 17);
  if (required) return required;
  if (!BSSID_PATTERN.test(String(value).trim())) {
    return 'Use el formato aa:bb:cc:dd:ee:ff (seis pares hexadecimales). Ejemplo: 3c:22:fb:a1:09:4e.';
  }
  return null;
}
