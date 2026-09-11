import { useState } from 'react';
import { PhoneInput } from '@/shared/components/PhoneInput';
import { SignaturePad } from '@/shared/components/SignaturePad';
import { generateTemporaryPassword } from '@/shared/utils/generateTemporaryPassword';

export function FormField({ id, label, required, error, hint, children, wide = false }) {
  return (
    <div className={wide ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      {label ? (
        <label htmlFor={id} className="app-label">
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="app-field-error">{error}</p> : null}
      {!error && hint ? <p className="mt-0.5 text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}

export function EnabledSwitch({ checked, onChange, title = 'Registro habilitado', hint, disabled = false }) {
  return (
    <div className="app-switch-row sm:col-span-2">
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        {hint ? <p className="mt-0.5 text-sm text-text-muted">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        className={`app-switch ${checked ? 'is-on' : ''}`}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
      >
        <span className="app-switch-knob" />
      </button>
    </div>
  );
}

export function FormActions({ submitLabel, onCancel }) {
  return (
    <div className="flex flex-wrap gap-3 pt-2 sm:col-span-2">
      <button type="submit" className="app-btn app-btn--primary">
        {submitLabel}
      </button>
      <button type="button" className="app-btn app-btn--ghost" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}

function controlClass(error) {
  return error ? 'app-input app-input--error' : 'app-input';
}

export function SchemaForm({
  fields,
  values,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  onBlurField,
}) {
  const [revealed, setRevealed] = useState({});

  function setField(name, value) {
    onChange({ ...values, [name]: value });
  }

  function blurField(name) {
    onBlurField?.(name);
  }

  function setPasswordVisible(name, visible) {
    setRevealed((current) => ({ ...current, [name]: visible }));
  }

  return (
    <form className="app-fields" onSubmit={onSubmit} noValidate>
      {fields.map((field) => {
        if (field.hiddenWhen?.(values)) {
          return null;
        }

        if (field.type === 'switch') {
          return (
            <EnabledSwitch
              key={field.name}
              checked={Boolean(values[field.name])}
              title={field.label}
              hint={field.hint}
              disabled={Boolean(field.disabled || field.readOnly || field.disabledWhen?.(values))}
              onChange={(next) => setField(field.name, next)}
            />
          );
        }

        const id = `field-${field.name}`;
        const wide = field.wide || field.type === 'textarea';

        if (field.type === 'select') {
          return (
            <FormField key={field.name} id={id} label={field.label} required={field.required} error={errors[field.name]} hint={field.hint} wide={wide}>
              <select
                id={id}
                className={controlClass(errors[field.name])}
                value={values[field.name] ?? ''}
                disabled={Boolean(field.readOnly)}
                onChange={(event) => setField(field.name, event.target.value)}
                onBlur={() => blurField(field.name)}
              >
                <option value="">{field.placeholder ?? 'Seleccione…'}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value} disabled={Boolean(option.disabled)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          );
        }

        if (field.type === 'multiselect') {
          const selected = Array.isArray(values[field.name]) ? values[field.name].map(String) : [];
          const disabled = Boolean(field.readOnly);
          return (
            <FormField
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              error={errors[field.name]}
              hint={field.hint}
              wide
            >
              <div
                id={id}
                role="group"
                aria-labelledby={`${id}-legend`}
                className={`max-h-48 space-y-2 overflow-y-auto rounded-md border px-3 py-2 ${
                  errors[field.name]
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border)]'
                } ${disabled ? 'opacity-70' : 'bg-[var(--color-surface-card)]'}`}
                onBlur={() => blurField(field.name)}
              >
                <span id={`${id}-legend`} className="sr-only">
                  {field.label}
                </span>
                {(field.options ?? []).length === 0 ? (
                  <p className="text-sm text-text-muted">No hay empresas disponibles.</p>
                ) : (
                  (field.options ?? []).map((option) => {
                    const value = String(option.value);
                    const checked = selected.includes(value);
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-2 text-sm text-navy ${
                          disabled || option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--color-accent)]"
                          checked={checked}
                          disabled={disabled || Boolean(option.disabled)}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selected, value]
                              : selected.filter((idValue) => idValue !== value);
                            setField(field.name, next);
                          }}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </FormField>
          );
        }

        if (field.type === 'tel') {
          const prefijoName = field.prefijoName ?? `${field.name}Prefijo`;
          // El prefijo (`values[prefijoName]`) alimenta validarTelefono vía resolvePhoneCountry.
          // `field.pais` fija el país cuando el formulario ya conoce el ISO (p. ej. sede).
          return (
            <FormField
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              error={errors[field.name]}
              hint={field.hint ?? (field.paises?.length ? null : 'Registre países con código telefónico para elegir el prefijo.')}
              wide
            >
              <PhoneInput
                id={id}
                paises={field.paises}
                prefijo={values[prefijoName] ?? field.pais?.codigoTelefonico ?? ''}
                numero={values[field.name] ?? ''}
                error={errors[field.name]}
                disabled={Boolean(field.readOnly)}
                maxLength={field.maxLength ?? 30}
                autoComplete={field.autoComplete}
                onPrefijoChange={(next) => setField(prefijoName, next)}
                onNumeroChange={(next) => setField(field.name, next)}
                onBlurNumero={() => blurField(field.name)}
              />
            </FormField>
          );
        }

        if (field.type === 'signature') {
          return (
            <FormField
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              error={errors[field.name]}
              hint={field.hint}
              wide
            >
              <SignaturePad
                value={values[field.name] ?? ''}
                disabled={Boolean(field.readOnly)}
                onChange={(next) => setField(field.name, next)}
              />
            </FormField>
          );
        }

        if (field.type === 'textarea') {
          return (
            <FormField key={field.name} id={id} label={field.label} required={field.required} error={errors[field.name]} hint={field.hint} wide>
              <textarea
                id={id}
                className={`${controlClass(errors[field.name])} app-textarea`}
                value={values[field.name] ?? ''}
                maxLength={field.maxLength}
                rows={field.rows ?? 3}
                onChange={(event) => setField(field.name, event.target.value)}
                onBlur={() => blurField(field.name)}
              />
            </FormField>
          );
        }

        if (field.generateAction) {
          const visible = Boolean(revealed[field.name]);
          return (
            <FormField
              key={field.name}
              id={id}
              label={field.label}
              required={field.required}
              error={errors[field.name]}
              hint={field.hint}
              wide
            >
              <div className="app-input-with-action">
                <div className="app-input-password">
                  <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    className={controlClass(errors[field.name])}
                    value={values[field.name] ?? ''}
                    maxLength={field.maxLength}
                    autoComplete={field.autoComplete}
                    readOnly={Boolean(field.readOnly)}
                    onChange={(event) => setField(field.name, event.target.value)}
                    onBlur={() => blurField(field.name)}
                  />
                  <button
                    type="button"
                    className="app-icon-btn"
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={visible}
                    onClick={() => setPasswordVisible(field.name, !visible)}
                  >
                    <i className={visible ? 'pi pi-eye-slash' : 'pi pi-eye'} aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  className="app-btn app-btn--ghost app-btn--sm"
                  onClick={() => {
                    setField(field.name, generateTemporaryPassword());
                    setPasswordVisible(field.name, true);
                  }}
                >
                  Generar
                </button>
              </div>
            </FormField>
          );
        }

        return (
          <FormField key={field.name} id={id} label={field.label} required={field.required} error={errors[field.name]} hint={field.hint} wide={wide}>
            <input
              id={id}
              type={field.type ?? 'text'}
              className={controlClass(errors[field.name])}
              value={values[field.name] ?? ''}
              maxLength={field.maxLength}
              step={field.step}
              min={field.min}
              autoComplete={field.autoComplete ?? (field.suggestions ? 'off' : undefined)}
              list={field.suggestions?.length ? `${id}-list` : undefined}
              readOnly={Boolean(field.readOnly)}
              onChange={(event) => setField(field.name, event.target.value)}
              onBlur={() => blurField(field.name)}
            />
            {field.suggestions?.length ? (
              <datalist id={`${id}-list`}>
                {field.suggestions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            ) : null}
          </FormField>
        );
      })}
      <FormActions submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}
