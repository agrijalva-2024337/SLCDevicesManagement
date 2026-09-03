import { useState } from 'react';
import { SchemaForm } from '@/shared/components/RecordForm';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

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
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

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
        fields={fields}
        values={values}
        errors={errors}
        submitLabel={saving ? 'Guardando…' : submitLabel}
        onChange={(next) => {
          const patched = typeof deriveValues === 'function' ? deriveValues(next, values) : next;
          setValues(patched);
          setErrors({});
          setFormError(null);
        }}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </DetailOverlay>
  );
}
