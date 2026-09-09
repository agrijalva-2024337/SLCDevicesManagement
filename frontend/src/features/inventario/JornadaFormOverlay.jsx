import { useMemo } from 'react';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  requireSelect,
  validarNombrePersona,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';

export function JornadaFormOverlay({ open, sedes, jornadasAbiertas = [], onSave, onClose }) {
  const ocupadas = useMemo(
    () => new Set((jornadasAbiertas ?? []).map((row) => Number(row.idSede))),
    [jornadasAbiertas],
  );
  const sedesDisponibles = useMemo(
    () => (sedes ?? []).filter((sede) => sede.habilitado !== false && !ocupadas.has(Number(sede.id))),
    [ocupadas, sedes],
  );

  const fields = useMemo(
    () => [
      {
        name: 'idSede',
        label: 'Sede',
        type: 'select',
        required: true,
        options: asOptions(sedesDisponibles),
        hint: 'Una sola jornada abierta por sede. Las que ya tienen conteo en curso no aparecen.',
      },
      {
        name: 'responsable',
        label: 'Responsable',
        maxLength: 150,
        hint: 'Texto libre. No es el catálogo de responsables.',
      },
      { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date', required: true },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [sedesDisponibles],
  );

  return (
    <RecordFormOverlay
      key="jornada-nueva"
      open={open}
      title="Abrir jornada"
      kicker="Inventario"
      hint="La jornada se delimita por sede. La ubicación se usa después, al contar."
      fields={fields}
      initialValues={{
        idSede: '',
        responsable: '',
        fechaInicio: todayIsoDate(),
        observaciones: '',
      }}
      validate={(values) =>
        compactErrors({
          idSede: requireSelect(values.idSede, 'una sede'),
          responsable: validarNombrePersona(values.responsable, 'responsable', 150, {
            required: false,
          }),
          fechaInicio: requireSelect(values.fechaInicio, 'una fecha de inicio'),
          observaciones: validarTextoLibre(values.observaciones, 'observaciones', 300, {
            required: false,
          }),
        })
      }
      onSave={onSave}
      onClose={onClose}
      submitLabel="Abrir jornada"
    />
  );
}
