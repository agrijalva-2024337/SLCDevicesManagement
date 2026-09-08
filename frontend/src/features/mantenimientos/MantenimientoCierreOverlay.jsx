import { useMemo } from 'react';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';

export function MantenimientoCierreOverlay({ open, record, onSave, onClose }) {
  const initialValues = useMemo(
    () => ({
      trabajoRealizado: '',
      costo: '',
      numeroFactura: '',
      fechaDevolucion: todayIsoDate(),
      observaciones: record?.observaciones ?? '',
    }),
    [record],
  );

  const fields = useMemo(
    () => [
      {
        name: 'trabajoRealizado',
        label: 'Trabajo realizado',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
      { name: 'costo', label: 'Costo', type: 'number', min: 0, step: '0.01' },
      { name: 'numeroFactura', label: 'Número de factura', maxLength: 50 },
      { name: 'fechaDevolucion', label: 'Fecha de cierre', type: 'date', required: true },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [],
  );

  return (
    <RecordFormOverlay
      key={`cierre-${record?.id ?? 'nuevo'}`}
      open={open}
      title={record ? `Finalizar ${record.activoNombre}` : 'Finalizar mantenimiento'}
      kicker="Operaciones"
      hint="Al finalizar, el activo vuelve a disponible."
      fields={fields}
      initialValues={initialValues}
      validate={(values) => {
        const errors = {
          trabajoRealizado: optionalText(values.trabajoRealizado, 'trabajo realizado', 300),
          numeroFactura: optionalText(values.numeroFactura, 'numero factura', 50),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
          fechaDevolucion: requireSelect(values.fechaDevolucion, 'una fecha de cierre'),
        };
        if (values.costo !== '' && values.costo != null && Number(values.costo) < 0) {
          errors.costo = 'El campo costo debe ser mayor o igual a 0.';
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Finalizar mantenimiento"
    />
  );
}
