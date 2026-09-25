import { useMemo } from 'react';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import { asOptions, compactErrors, optionalText, requireSelect } from '@/shared/components/recordFormUtils';
import { isActivoAsignado, isActivoDeBaja, isActivoEnMantenimiento } from '@/features/activos/activoAcciones';
import {
  activosDeEmpresa,
  initialTrasladoValues,
  nombreUbicacion,
  ubicacionesDeEmpresa,
} from '@/features/inventario/trasladoRuta';
import { byId } from '@/shared/utils/format';

function nombreUsuario(usuario) {
  if (!usuario) return '—';
  return [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.correo || `Usuario #${usuario.id}`;
}

export function TrasladoFormOverlay({
  open,
  prefill,
  activos,
  ubicaciones,
  sedes,
  usuarioActual,
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
      activosDeEmpresa(
        (activos ?? []).filter(
          (item) =>
            !isActivoDeBaja(item, ctx) &&
            !isActivoEnMantenimiento(item, ctx) &&
            !isActivoAsignado(item, ctx),
        ),
        ubicaciones,
        sedes,
        idEmpresaActiva,
      ),
    [activos, asignaciones, idEmpresaActiva, sedes, tipos, ubicaciones],
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
      },
      {
        name: 'origen',
        label: 'Origen',
        type: 'text',
        readOnly: true,
      },
      {
        name: 'idUbicacionDestino',
        label: 'Destino',
        type: 'select',
        required: true,
        options: asOptions(destinos),
      },
      {
        name: 'registradoPor',
        label: 'Registrado por',
        type: 'text',
        readOnly: true,
        hint: 'Usuario que registra el traslado.',
      },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      {
        name: 'motivo',
        label: 'Motivo',
        type: 'textarea',
        maxLength: 300,
        wide: true,
        hint: 'Por qué se mueve el activo.',
      },
    ],
    [activos, activosElegibles, destinos, lockActivo],
  );

  return (
    <RecordFormOverlay
      key={`traslado-${prefill?.idActivo ?? 'nuevo'}`}
      open={open}
      title="Registrar traslado"
      kicker="Inventario"
      hint="El origen es la ubicación actual del activo y no se edita. Quien registra queda como el usuario en sesión."
      fields={fields}
      initialValues={{
        ...initialValues,
        registradoPor: nombreUsuario(usuarioActual),
      }}
      deriveValues={(next) => {
        const activo = byId(activos, next.idActivo);
        return {
          ...next,
          origen: activo ? nombreUbicacion(byId(ubicaciones, activo.idUbicacion)) : '',
          registradoPor: nombreUsuario(usuarioActual),
        };
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idUbicacionDestino: requireSelect(values.idUbicacionDestino, 'una ubicación destino'),
          fecha: requireSelect(values.fecha, 'una fecha'),
          motivo: optionalText(values.motivo, 'motivo', 300),
        };
        if (!usuarioActual?.id) {
          errors.registradoPor = 'No se pudo determinar el usuario en sesión.';
        }
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo está dado de baja. No se traslada ni se envía a mantenimiento.';
        } else if (activo && isActivoEnMantenimiento(activo, ctx)) {
          errors.idActivo = 'El activo está en mantenimiento. Finalícelo antes de trasladarlo.';
        } else if (activo && isActivoAsignado(activo, ctx)) {
          errors.idActivo = 'El activo tiene una asignación activa. Devuélvalo antes de trasladarlo.';
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
