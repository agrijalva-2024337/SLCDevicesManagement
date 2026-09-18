import { useMemo } from 'react';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  requireSelect,
  validarTextoLibre,
} from '@/shared/components/recordFormUtils';

export function JornadaFormOverlay({
  open,
  sedes,
  responsables = [],
  puedeElegirResponsable = false,
  jornadasAbiertas = [],
  onSave,
  onClose,
}) {
  const ocupadas = useMemo(
    () => new Set((jornadasAbiertas ?? []).map((row) => Number(row.idSede))),
    [jornadasAbiertas],
  );
  const sedesDisponibles = useMemo(
    () => (sedes ?? []).filter((sede) => sede.habilitado !== false && !ocupadas.has(Number(sede.id))),
    [ocupadas, sedes],
  );

  const fields = useMemo(() => {
    const base = [
      {
        name: 'idSede',
        label: 'Sede',
        type: 'select',
        required: true,
        options: asOptions(sedesDisponibles),
        hint: 'Una sola jornada abierta por sede. Las que ya tienen conteo en curso no aparecen.',
      },
    ];

    if (puedeElegirResponsable) {
      base.push({
        name: 'idUsuario',
        label: 'Responsable',
        type: 'select',
        required: true,
        options: asOptions(responsables),
        hint: 'Solo usuarios con rol operador de inventario.',
      });
    }

    base.push(
      { name: 'fechaInicio', label: 'Fecha de inicio', type: 'date', required: true },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    );

    return base;
  }, [puedeElegirResponsable, responsables, sedesDisponibles]);

  return (
    <RecordFormOverlay
      key="jornada-nueva"
      open={open}
      title="Abrir jornada"
      kicker="Inventario"
      hint={
        puedeElegirResponsable
          ? 'Seleccione el operador de inventario que quedará como responsable.'
          : 'La jornada quedará registrada a su nombre.'
      }
      fields={fields}
      initialValues={{
        idSede: '',
        idUsuario: '',
        fechaInicio: todayIsoDate(),
        observaciones: '',
      }}
      validate={(values) =>
        compactErrors({
          idSede: requireSelect(values.idSede, 'una sede'),
          idUsuario: puedeElegirResponsable
            ? requireSelect(values.idUsuario, 'un responsable')
            : null,
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
