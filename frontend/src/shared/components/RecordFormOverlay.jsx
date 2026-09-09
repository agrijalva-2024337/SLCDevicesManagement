import { useState } from 'react';
import { SchemaForm } from '@/shared/components/RecordForm';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function changedKeys(next, prev) {
  const keys = new Set([...Object.keys(next ?? {}), ...Object.keys(prev ?? {})]);
  return [...keys].filter((key) => String(next?.[key] ?? '') !== String(prev?.[key] ?? ''));
}

function liveErrors(allErrors, values, touched, attempted) {
  if (attempted) return allErrors ?? {};
  return Object.fromEntries(
    Object.entries(allErrors ?? {}).filter(([key, message]) => {
      if (!message) return false;
      if (touched[key]) return true;
      // Mientras escribe: muestra formato en campos con contenido (no “obligatorio” vacío).
      return String(values?.[key] ?? '').trim() !== '';
    }),
  );
}

export function RecordFormOverlay({
  open,
  title,
  kicker,
  badge,
  hint,
  fields,
  initialValues,
  validate,
  onSave,
  onClose,
  submitLabel,
  deriveValues,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  function applyValidation(nextValues, nextTouched = touched, nextAttempted = attempted) {
    const all = validate(nextValues) ?? {};
    setErrors(liveErrors(all, nextValues, nextTouched, nextAttempted));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextAttempted = true;
    setAttempted(nextAttempted);
    const nextErrors = validate(values) ?? {};
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await onSave(values);
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === 'object') {
        setErrors(error.fieldErrors);
      }
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DetailOverlay open={open} title={title} kicker={kicker} badge={badge} onClose={onClose}>
      {hint ? <p className="text-base text-text-muted">{hint}</p> : null}
      {formError ? (
        <div className="app-feedback app-feedback--error" role="alert">
          {formError}
        </div>
      ) : null}
      <SchemaForm
        fields={typeof fields === 'function' ? fields(values) : fields}
        values={values}
        errors={errors}
        submitLabel={saving ? 'Guardando…' : submitLabel}
        onChange={(next) => {
          const patched = typeof deriveValues === 'function' ? deriveValues(next, values) : next;
          const dirty = changedKeys(patched, values);
          const nextTouched = { ...touched };
          for (const key of dirty) nextTouched[key] = true;
          // Campos autorrellenados (ISO, código) también se consideran tocados.
          setTouched(nextTouched);
          setValues(patched);
          setFormError(null);
          applyValidation(patched, nextTouched, attempted);
        }}
        onBlurField={(name) => {
          const nextTouched = { ...touched, [name]: true };
          setTouched(nextTouched);
          applyValidation(values, nextTouched, attempted);
        }}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </DetailOverlay>
  );
}
