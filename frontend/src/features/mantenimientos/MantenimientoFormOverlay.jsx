import { useMemo } from 'react';
import { isActivoAsignado, isActivoDeBaja, isActivoEnMantenimiento } from '@/features/activos/activoAcciones';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect, requireText } from '@/shared/components/recordFormUtils';
import { byId } from '@/shared/utils/format';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function sedeDeActivo(activo, ubicaciones, sedes) {
  const ubicacion = byId(ubicaciones, activo?.idUbicacion);
  const sede = byId(sedes, ubicacion?.idSede);
  if (!ubicacion) return 'Sin ubicación';
  return sede ? `${nombreUbicacion(ubicacion)} · ${sede.nombre}` : nombreUbicacion(ubicacion);
}

export function MantenimientoFormOverlay({
  open,
  prefill,
  activos,
  ubicaciones,
  sedes,
  responsables,
  tiposMantenimiento = [],
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
  const initialValues = useMemo(() => {
    const idActivo = prefill?.idActivo ? String(prefill.idActivo) : '';
    const activo = byId(activos, idActivo);
    return {
      idActivo,
      sede: idActivo ? sedeDeActivo(activo, ubicaciones, sedes) : '',
      idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
      fecha: todayIsoDate(),
      idTipoMantenimiento: '',
      descripcionProblema: '',
      observaciones: '',
    };
  }, [activos, prefill, sedes, ubicaciones]);

  const fields = useMemo(
    () => [
      {
        name: 'idActivo',
        label: 'Activo',
        type: 'select',
        required: true,
        readOnly: lockActivo,
        options: asOptions(lockActivo ? (activos ?? []) : activosElegibles, 'nombre'),
        hint: 'Solo activos libres, sin asignación ni mantenimiento abierto.',
      },
      {
        name: 'sede',
        label: 'Sede',
        type: 'text',
        readOnly: true,
        hint: 'Ubicación y sede actuales del activo.',
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
      { name: 'fecha', label: 'Fecha de apertura', type: 'date', required: true },
      {
        name: 'idTipoMantenimiento',
        label: 'Tipo de mantenimiento',
        type: 'select',
        required: true,
        options: asOptions(Array.isArray(tiposMantenimiento) ? tiposMantenimiento : []),
        hint:
          (tiposMantenimiento ?? []).length === 0
            ? 'No hay tipos disponibles. Revise el catálogo.'
            : 'Preventivo o correctivo.',
      },
      {
        name: 'descripcionProblema',
        label: 'Descripción del problema',
        type: 'textarea',
        required: true,
        maxLength: 300,
        wide: true,
        hint: 'Qué falló o qué se va a revisar.',
      },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
    ],
    [activos, activosElegibles, lockActivo, responsables, tiposMantenimiento],
  );

  return (
    <RecordFormOverlay
      key={`mantenimiento-${prefill?.idActivo ?? 'nuevo'}`}
      open={open}
      title="Abrir mantenimiento"
      kicker="Operaciones"
      hint="El tipo y la descripción del problema son obligatorios."
      fields={fields}
      initialValues={initialValues}
      deriveValues={(next) => {
        const activo = byId(activos, next.idActivo);
        return {
          ...next,
          sede: activo ? sedeDeActivo(activo, ubicaciones, sedes) : '',
        };
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha'),
          idTipoMantenimiento:
            (tiposMantenimiento ?? []).length === 0
              ? 'No hay tipos de mantenimiento disponibles.'
              : requireSelect(values.idTipoMantenimiento, 'un tipo de mantenimiento'),
          descripcionProblema: requireText(values.descripcionProblema, 'descripcion del problema', 300),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
        };
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo está dado de baja. No se envía a mantenimiento.';
        } else if (activo && isActivoEnMantenimiento(activo, ctx)) {
          errors.idActivo = 'El activo ya está en mantenimiento.';
        } else if (activo && isActivoAsignado(activo, ctx)) {
          errors.idActivo = 'El activo tiene una asignación activa. Devuélvalo antes de enviarlo a mantenimiento.';
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Abrir mantenimiento"
    />
  );
}
