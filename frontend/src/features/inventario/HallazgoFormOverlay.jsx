import { useMemo } from 'react';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors, requireSelect, validarTextoLibre } from '@/shared/components/recordFormUtils';

export function HallazgoFormOverlay({ open, prefill, onSave, onClose }) {
  const lockActivo = Boolean(prefill?.idActivo);
  const isEdit = Boolean(prefill?.id);
  const initialValues = useMemo(
    () => ({
      idActivo: prefill?.idActivo ? String(prefill.idActivo) : '',
      activoNombre: prefill?.activoNombre ?? '',
      encontrado: prefill?.encontrado ?? true,
      buenEstado: prefill?.encontrado === false ? false : (prefill?.buenEstado ?? true),
      observaciones: prefill?.observaciones ?? '',
      fechaVerificacion: prefill?.fechaVerificacion
        ? String(prefill.fechaVerificacion).slice(0, 10)
        : todayIsoDate(),
    }),
    [prefill],
  );

  const fields = useMemo(
    () => [
      {
        name: 'activoNombre',
        label: 'Activo',
        readOnly: true,
        hint: lockActivo ? 'El activo sale de la hoja de conteo.' : undefined,
      },
      {
        name: 'encontrado',
        label: 'Encontrado',
        type: 'switch',
      },
      {
        name: 'buenEstado',
        label: 'Buen estado',
        type: 'switch',
        disabledWhen: (values) => !values.encontrado,
        hint: 'Si el activo no se encontró, no se evalúa el estado.',
      },
      {
        name: 'fechaVerificacion',
        label: 'Fecha de verificación',
        type: 'date',
        required: !isEdit,
        readOnly: isEdit,
        hint: isEdit ? 'El command de edición no admite cambiar la fecha.' : undefined,
      },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [isEdit, lockActivo],
  );

  return (
    <RecordFormOverlay
      key={`hallazgo-${prefill?.id ?? prefill?.idActivo ?? 'nuevo'}`}
      open={open}
      title={isEdit ? 'Editar hallazgo' : 'Registrar hallazgo'}
      kicker="Inventario"
      hint="Un activo no encontrado no puede evaluarse. El reporte de diferencias pide observaciones cuando el hallazgo es negativo."
      fields={fields}
      initialValues={initialValues}
      deriveValues={(next) => {
        if (!next.encontrado) {
          return { ...next, buenEstado: false };
        }
        return next;
      }}
      validate={(values) => {
        const negativo = !values.encontrado || !values.buenEstado;
        const errors = {
          idActivo: values.idActivo ? null : requireSelect(values.idActivo, 'un activo'),
          fechaVerificacion: isEdit ? null : requireSelect(values.fechaVerificacion, 'una fecha'),
          observaciones: validarTextoLibre(values.observaciones, 'observaciones', 300, {
            required: negativo,
          }),
        };
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel={isEdit ? 'Guardar hallazgo' : 'Registrar hallazgo'}
    />
  );
}
