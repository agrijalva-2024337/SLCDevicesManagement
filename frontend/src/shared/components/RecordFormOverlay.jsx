import { useEffect, useState } from 'react';
import { SchemaForm } from '@/shared/components/RecordForm';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { SaveSuccessPanel } from '@/shared/components/SaveSuccessPanel';
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
      return String(values?.[key] ?? '').trim() !== '';
    }),
  );
}

function normalizeSuccess(result) {
  if (result === false || result?.skipSuccess) return null;
  if (result && (result.action === 'created' || result.action === 'updated')) {
    return result;
  }
  return {
    action: result?.created === false || result?.updated ? 'updated' : 'created',
    entityLabel: result?.entityLabel ?? null,
    passwordGenerada: result?.passwordGenerada ?? null,
  };
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
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open) {
      setSuccess(null);
      setSaving(false);
      setFormError(null);
      setAttempted(false);
      setTouched({});
      setErrors({});
      return;
    }
    setValues(initialValues);
    setSuccess(null);
    setSaving(false);
    setFormError(null);
    setAttempted(false);
    setTouched({});
    setErrors({});
    // Solo al abrir/reabrir el overlay; initialValues se toma en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open edge
  }, [open]);

  function applyValidation(nextValues, nextTouched = touched, nextAttempted = attempted) {
    const all = validate(nextValues) ?? {};
    setErrors(liveErrors(all, nextValues, nextTouched, nextAttempted));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || success) {
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
      const result = await onSave(values);
      const nextSuccess = normalizeSuccess(result);
      if (nextSuccess) {
        setSuccess(nextSuccess);
      } else {
        onClose();
      }
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
    <DetailOverlay
      open={open}
      title={success ? (success.action === 'created' ? 'Registrado' : 'Actualizado') : title}
      kicker={success ? 'Listo' : kicker}
      badge={success ? null : badge}
      variant={success ? 'success' : 'default'}
      onClose={onClose}
    >
      {success ? (
        <SaveSuccessPanel
          action={success.action}
          entityLabel={success.entityLabel}
          passwordGenerada={success.passwordGenerada}
          onDone={onClose}
        />
      ) : (
        <>
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
        </>
      )}
    </DetailOverlay>
  );
}
