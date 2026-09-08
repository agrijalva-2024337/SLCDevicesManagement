import { useMemo } from 'react';
import {
  isActivoAsignado,
  isActivoDeBaja,
  isActivoEnMantenimiento,
} from '@/features/activos/activoAcciones';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  optionalText,
  requireSelect,
  requireText,
} from '@/shared/components/recordFormUtils';
import { byId } from '@/shared/utils/format';

function usuarioNombre(usuario) {
  if (!usuario) return `Usuario`;
  return [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.correo || `Usuario ${usuario.id}`;
}

export function BajaFormOverlay({
  open,
  prefill,
  activos,
  motivos,
  usuarios,
  usuariosUnavailableReason,
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

  const usuarioOptions = useMemo(
    () => asOptions((usuarios ?? []).filter((item) => item.habilitado !== false).map((item) => ({ id: item.id, nombre: usuarioNombre(item) }))),
    [usuarios],
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
        hint: 'Solo activos libres.',
      },
      {
        name: 'idMotivoBaja',
        label: 'Motivo de baja',
        type: 'select',
        required: true,
        options: asOptions(motivos ?? []),
      },
      {
        name: 'idAutorizadoPor',
        label: 'Autorizado por',
        type: 'select',
        required: !usuariosUnavailableReason,
        readOnly: Boolean(usuariosUnavailableReason),
        options: usuarioOptions,
        hint: usuariosUnavailableReason || undefined,
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
        name: 'documentoReferencia',
        label: 'Documento de referencia',
        maxLength: 300,
      },
      {
        name: 'documentoPdfUrl',
        label: 'URL del documento PDF',
        required: true,
        maxLength: 300,
        wide: true,
        hint: 'Dirección del documento PDF que respalda la baja.',
      },
      {
        name: 'observaciones',
        label: 'Observaciones',
        type: 'textarea',
        maxLength: 300,
        wide: true,
      },
      {
        name: 'firmaEntrega',
        label: 'Firma de quien entrega',
        type: 'signature',
        hint: 'Opcional. Se puede guardar sin firmar.',
      },
      {
        name: 'firmaRecibe',
        label: 'Firma de quien autoriza',
        type: 'signature',
        hint: 'Opcional. Se puede guardar sin firmar.',
      },
    ],
    [activos, activosElegibles, lockActivo, motivos, responsables, usuarioOptions, usuariosUnavailableReason],
  );

  return (
    <RecordFormOverlay
      key={`baja-${prefill?.idActivo ?? 'nueva'}`}
      open={open}
      title="Registrar baja"
      kicker="Operaciones"
      hint="Indique el motivo y la dirección del documento."
      fields={fields}
      initialValues={{
        idActivo: prefill?.idActivo ? String(prefill.idActivo) : '',
        idMotivoBaja: '',
        idAutorizadoPor: prefill?.idAutorizadoPor ? String(prefill.idAutorizadoPor) : '',
        idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
        fecha: todayIsoDate(),
        documentoReferencia: '',
        documentoPdfUrl: '',
        observaciones: '',
        firmaEntrega: '',
        firmaRecibe: '',
      }}
      validate={(values) => {
        const activo = byId(activos, values.idActivo);
        const errors = {
          idActivo: requireSelect(values.idActivo, 'un activo'),
          idMotivoBaja: requireSelect(values.idMotivoBaja, 'un motivo de baja'),
          idAutorizadoPor: usuariosUnavailableReason || requireSelect(values.idAutorizadoPor, 'quien autoriza'),
          idResponsable: requireSelect(values.idResponsable, 'un responsable'),
          fecha: requireSelect(values.fecha, 'una fecha'),
          documentoReferencia: optionalText(values.documentoReferencia, 'documento de referencia', 300),
          documentoPdfUrl: requireText(values.documentoPdfUrl, 'documento pdf url', 300),
          observaciones: optionalText(values.observaciones, 'observaciones', 300),
        };
        if (activo && isActivoDeBaja(activo, ctx)) {
          errors.idActivo = 'El activo ya esta dado de baja.';
        } else if (activo && (isActivoAsignado(activo, ctx) || isActivoEnMantenimiento(activo, ctx))) {
          errors.idActivo = 'El activo tiene una asignacion o un mantenimiento activo. Cierren el proceso antes de dar de baja.';
        }
        return compactErrors(errors);
      }}
      onSave={onSave}
      onClose={onClose}
      submitLabel="Registrar baja"
    />
  );
}
