import { optionalText } from '@/shared/components/recordFormUtils';

export function normalizeDialCode(code) {
  const digits = String(code ?? '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function paisesConPrefijo(paises = []) {
  return (paises ?? [])
    .map((pais) => ({
      ...pais,
      codigoTelefonico: normalizeDialCode(pais.codigoTelefonico),
    }))
    .filter((pais) => pais.codigoTelefonico)
    .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es'));
}

export function defaultDialCode(paises = []) {
  const options = paisesConPrefijo(paises);
  const guatemala = options.find((pais) => String(pais.codigoIso2 ?? '').toUpperCase() === 'GT');
  return (guatemala ?? options[0])?.codigoTelefonico ?? '';
}

export function splitStoredPhone(stored, paises = []) {
  const numero = String(stored ?? '').trim();
  const options = paisesConPrefijo(paises);
  const fallback = defaultDialCode(options);
  if (!numero) {
    return { prefijo: fallback, numero: '' };
  }

  const codes = [...new Set(options.map((pais) => pais.codigoTelefonico))].sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (numero.startsWith(code)) {
      return {
        prefijo: code,
        numero: numero.slice(code.length).replace(/^[\s.-]+/, ''),
      };
    }
  }

  return { prefijo: fallback, numero };
}

export function joinPhone(prefijo, numero) {
  const local = String(numero ?? '').trim();
  if (!local) {
    return '';
  }
  const code = normalizeDialCode(prefijo);
  return code ? `${code} ${local}` : local;
}

export function sanitizeLocalNumber(value) {
  return String(value ?? '').replace(/[^\d\s().-]/g, '');
}

export function phoneFormFields(stored, paises = []) {
  const { prefijo, numero } = splitStoredPhone(stored, paises);
  return { telefonoPrefijo: prefijo, telefono: numero };
}

export function phonePayload(values) {
  return joinPhone(values.telefonoPrefijo, values.telefono) || null;
}

export function validatePhoneFields(values, { label = 'teléfono', max = 30 } = {}) {
  const numero = String(values.telefono ?? '').trim();
  const prefijo = String(values.telefonoPrefijo ?? '').trim();
  if (numero && !prefijo) {
    return 'Seleccione el prefijo del país.';
  }
  return optionalText(joinPhone(prefijo, numero), label, max);
}
