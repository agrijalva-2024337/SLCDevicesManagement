export function FormField({ id, label, required, error, hint, children, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
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

export function EnabledSwitch({ checked, onChange, title = 'Registro habilitado', hint }) {
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
        className={`app-switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
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

export function SchemaForm({ fields, values, errors, onChange, onSubmit, onCancel, submitLabel }) {
  function setField(name, value) {
    onChange({ ...values, [name]: value });
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
      {fields.map((field) => {
        if (field.type === 'switch') {
          return (
            <EnabledSwitch
              key={field.name}
              checked={Boolean(values[field.name])}
              title={field.label}
              hint={field.hint}
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
                onChange={(event) => setField(field.name, event.target.value)}
              >
                <option value="">{field.placeholder ?? 'Seleccione…'}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              />
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
              autoComplete={field.autoComplete}
              onChange={(event) => setField(field.name, event.target.value)}
            />
          </FormField>
        );
      })}
      <FormActions submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}
