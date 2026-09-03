import { useMemo } from 'react';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';
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
  onSave,
  onClose,
}) {
  const lockActivo = Boolean(prefill?.idActivo);
  const initialValues = useMemo(() => {
    const idActivo = prefill?.idActivo ? String(prefill.idActivo) : '';
    const activo = byId(activos, idActivo);
    return {
      idActivo,
      sede: idActivo ? sedeDeActivo(activo, ubicaciones, sedes) : '',
      idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
      fecha: todayIsoDate(),
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
        options: asOptions(activos ?? [], 'nombre'),
      },
      {
        name: 'sede',
        label: 'Sede',
        type: 'text',
        readOnly: true,
        hint: 'Derivado: Activo → Ubicación → Sede. No se envía al backend.',
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
        name: 'observaciones',
        label: 'Detalle',
        type: 'textarea',
        maxLength: 300,
        wide: true,
        hint: 'El DTO no tiene tipo preventivo/correctivo. Si aplica, descríbalo aquí.',
      },
    ],
    [activos, lockActivo, responsables],
  );

  return (
    <RecordFormOverlay
      key={`mantenimiento-${prefill?.idActivo ?? 'nuevo'}`}
      open={open}
      title="Abrir mantenimiento"
      kicker="Operaciones"
      hint="Se registra como una asignación de tipo Mantenimiento. BE-17 cambia el estado del activo mientras dura."
      fields={fields}
      initialValues={initialValues}
      deriveValues={(next) => {
        const activo = byId(activos, next.idActivo);
        return {
          ...next,
          sede: activo ? sedeDeActivo(activo, ubicaciones, sedes) : '',
        };
      }}
      validate={(values) =>
        compactErrors({
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha'),
          observaciones: optionalText(values.observaciones, 'detalle', 300),
        })
      }
      onSave={onSave}
      onClose={onClose}
      submitLabel="Abrir mantenimiento"
    />
  );
}
