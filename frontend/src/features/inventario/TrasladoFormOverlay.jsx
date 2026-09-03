import { useMemo } from 'react';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';
import { isActivoDeBaja, isActivoEnMantenimiento } from '@/features/activos/activoAcciones';
import { initialTrasladoValues, nombreUbicacion, ubicacionesDeEmpresa } from '@/features/inventario/trasladoRuta';
import { byId } from '@/shared/utils/format';

export function TrasladoFormOverlay({
  open,
  prefill,
  activos,
  ubicaciones,
  sedes,
  responsables,
  asignaciones = [],
  tipos = [],
  idEmpresaActiva,
  onSave,
  onClose,
}) {
  const lockActivo = Boolean(prefill?.idActivo);
  const ctx = { asignaciones, tipos };
  const activosElegibles = useMemo(
    () =>
      (activos ?? []).filter(
        (item) => !isActivoDeBaja(item, { asignaciones, tipos }) && !isActivoEnMantenimiento(item, { asignaciones, tipos }),
      ),
    [activos, asignaciones, tipos],
  );
  const initialValues = useMemo(
    () => initialTrasladoValues(prefill, { activos, ubicaciones }),
    [prefill, activos, ubicaciones],
  );

  const destinos = useMemo(
    () => ubicacionesDeEmpresa(ubicaciones, sedes, idEmpresaActiva),
    [idEmpresaActiva, sedes, ubicaciones],
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
        hint: 'El origen es la ubicación actual del activo. No se edita.',
      },
      {
        name: 'origen',
        label: 'Origen',
        type: 'text',
        readOnly: true,
        hint: 'Ubicación actual, leída antes de guardar.',
      },
      {
        name: 'idUbicacionDestino',
        label: 'Destino',
        type: 'select',
        required: true,
        options: asOptions(destinos),
        hint: 'Solo ubicaciones de la empresa activa.',
      },
      {
        name: 'idResponsable',
        label: 'Responsable',
        type: 'select',
        required: true,
        options: asOptions(
          (responsables ?? []).filter((item) => item.habilitado !== false),
          'nombreCompleto',
        ),
      },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [activos, activosElegibles, destinos, lockActivo, responsables],
  );

  return (
    <RecordFormOverlay
      key={`traslado-${prefill?.idActivo ?? 'nuevo'}`}
      open={open}
      title="Registrar traslado"
      kicker="Inventario"
      hint="El traslado se registra como una asignación de tipo Traslado. El origen no es un campo editable."
      fields={fields}
      initialValues={initialValues}
      deriveValues={(next) => {
        const activo = byId(activos, next.idActivo);
        return {
          ...next,
          origen: activo ? nombreUbicacion(byId(ubicaciones, activo.idUbicacion)) : '',
        };
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idUbicacionDestino: requireSelect(values.idUbicacionDestino, 'una ubicación destino'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha'),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
        };
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo está dado de baja. No se traslada ni se envía a mantenimiento.';
        } else if (activo && isActivoEnMantenimiento(activo, ctx)) {
          errors.idActivo = 'El activo está en mantenimiento. Finalícelo antes de trasladarlo.';
        }
        if (
          activo &&
          values.idUbicacionDestino &&
          Number(values.idUbicacionDestino) === Number(activo.idUbicacion)
        ) {
          errors.idUbicacionDestino = 'El destino no puede ser igual al origen.';
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Registrar traslado"
    />
  );
}
