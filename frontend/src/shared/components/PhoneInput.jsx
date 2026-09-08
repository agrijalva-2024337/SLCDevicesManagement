import { useEffect, useMemo } from 'react';
import { defaultDialCode, paisesConPrefijo, sanitizeLocalNumber } from '@/shared/utils/phoneNumber';

function flagClassName(iso2) {
  const code = String(iso2 ?? '')
    .trim()
    .toLowerCase();
  return /^[a-z]{2}$/.test(code) ? `fi fi-${code}` : null;
}

export function PhoneInput({
  id,
  paises = [],
  prefijo,
  numero,
  error,
  disabled = false,
  maxLength = 30,
  autoComplete = 'tel',
  onPrefijoChange,
  onNumeroChange,
}) {
  const options = useMemo(() => paisesConPrefijo(paises), [paises]);
  const fallback = defaultDialCode(options);
  const selected = options.find((pais) => pais.codigoTelefonico === prefijo) ?? options[0] ?? null;
  const flagClass = flagClassName(selected?.codigoIso2);
  const shownPrefijo = selected?.codigoTelefonico ?? prefijo ?? '';
  const localMax = Math.max(1, maxLength - (shownPrefijo ? shownPrefijo.length + 1 : 0));

  useEffect(() => {
    if (!prefijo && fallback) {
      onPrefijoChange(fallback);
    }
  }, [fallback, onPrefijoChange, prefijo]);

  return (
    <div className={error ? 'app-phone app-phone--error' : 'app-phone'}>
      <div className="app-phone-prefix">
        {flagClass ? <span className={`${flagClass} app-phone-flag`} aria-hidden="true" /> : null}
        <span className="app-phone-code">{shownPrefijo || '—'}</span>
        <i className="pi pi-chevron-down app-phone-caret" aria-hidden="true" />
        <select
          id={`${id}-prefijo`}
          aria-label="Prefijo del país"
          className="app-phone-select"
          value={shownPrefijo}
          disabled={disabled || options.length === 0}
          onChange={(event) => onPrefijoChange(event.target.value)}
        >
          {options.length === 0 ? (
            <option value="">Sin países</option>
          ) : (
            options.map((pais) => (
              <option key={pais.id} value={pais.codigoTelefonico}>
                {pais.nombre}
              </option>
            ))
          )}
        </select>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        className="app-input app-phone-number"
        value={numero ?? ''}
        maxLength={localMax}
        autoComplete={autoComplete}
        placeholder="Número"
        disabled={disabled}
        onChange={(event) => onNumeroChange(sanitizeLocalNumber(event.target.value))}
      />
    </div>
  );
}
