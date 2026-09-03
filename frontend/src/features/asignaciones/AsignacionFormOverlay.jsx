import { useMemo } from 'react';
import {
  isActivoAsignado,
  isActivoDeBaja,
  isActivoEnMantenimiento,
} from '@/features/activos/activoAcciones';
import { nombreUbicacion, todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';
import { byId } from '@/shared/utils/format';

function initialValues(prefill, { activos, ubicaciones } = {}) {
  const idActivo = prefill?.idActivo ? String(prefill.idActivo) : '';
  const activo = (activos ?? []).find((item) => Number(item.id) === Number(idActivo));
  const ubicacion = (ubicaciones ?? []).find((item) => Number(item.id) === Number(activo?.idUbicacion));
  return {
    idActivo,
    ubicacion: idActivo ? nombreUbicacion(ubicacion) : '',
    idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
    fecha: todayIsoDate(),
    observaciones: '',
  };
}

export function AsignacionFormOverlay({
  open,
  prefill,
  activos,
  ubicaciones,
  responsables,
  asignaciones = [],
  tipos = [],
  onSave,
  onClose,
}) {
  const lockActivo = Boolean(prefill?.idActivo);
  const ctx = { asignaciones, tipos };
  const activosElegibles = useMemo(
    () =>
      (activos ?? []).filter((item) => {
        const lookup = { asignaciones, tipos };
        return (
          !isActivoDeBaja(item, lookup) &&
          !isActivoEnMantenimiento(item, lookup) &&
          !isActivoAsignado(item, lookup)
        );
      }),
    [activos, asignaciones, tipos],
  );

  const fields = useMemo(
    () => [
      {
        name: 'idActivo',
        label: 'Activo',
        type: 'select',
        required: true,
        readOnly: lockActivo,
        options: asOptions(lockActivo ? (activos ?? []) : activosElegibles, 'nombre'),
        hint: 'Solo activos libres. El tipo Asignacion se resuelve por nombre, no se elige aquí.',
      },
      {
        name: 'ubicacion',
        label: 'Ubicación de uso',
        type: 'text',
        readOnly: true,
        hint: 'CreateAsignacionCommand exige idUbicacion. Se toma del activo.',
      },
      {
        name: 'idResponsable',
        label: 'Responsable que recibe',
        type: 'select',
        required: true,
        options: asOptions(
          (responsables ?? []).filter((item) => item.habilitado !== false),
          'nombreCompleto',
        ),
      },
      { name: 'fecha', label: 'Fecha de entrega', type: 'date', required: true },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [activos, activosElegibles, lockActivo, responsables],
  );

  return (
    <RecordFormOverlay
      key={`entrega-${prefill?.idActivo ?? 'nueva'}`}
      open={open}
      title="Registrar asignación"
      kicker="Entrega"
      hint="Entrega a un responsable. No elija Traslado, Mantenimiento ni Baja en esta pantalla. La devolución cierra con POST /devolver."
      fields={fields}
      initialValues={initialValues(prefill, { activos, ubicaciones })}
      deriveValues={(next) => {
        const activo = byId(activos, next.idActivo);
        return {
          ...next,
          ubicacion: activo ? nombreUbicacion(byId(ubicaciones, activo.idUbicacion)) : '',
        };
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha de entrega'),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
        };
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo está dado de baja. No se puede asignar.';
        } else if (activo && isActivoEnMantenimiento(activo, ctx)) {
          errors.idActivo = 'El activo está en mantenimiento. Finalícelo antes de asignarlo.';
        } else if (activo && isActivoAsignado(activo, ctx)) {
          errors.idActivo = 'El activo ya tiene una asignación activa.';
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Registrar entrega"
    />
  );
}
