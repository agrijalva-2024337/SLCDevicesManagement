import { useState } from 'react';
import { SchemaForm } from '@/shared/components/RecordForm';
import { DetailOverlay } from '@/shared/components/DetailOverlay';

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
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values) ?? {};
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(values);
  }

  return (
    <DetailOverlay open={open} title={title} kicker={kicker} badge={badge} onClose={onClose}>
      {hint ? <p className="text-base text-text-muted">{hint}</p> : null}
      <SchemaForm
        fields={fields}
        values={values}
        errors={errors}
        submitLabel={submitLabel}
        onChange={(next) => {
          setValues(next);
          setErrors({});
        }}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </DetailOverlay>
  );
}
