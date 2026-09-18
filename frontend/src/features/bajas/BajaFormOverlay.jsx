import { useMemo } from 'react';
import {
  isActivoAsignado,
  isActivoDeBaja,
  isActivoEnMantenimiento,
} from '@/features/activos/activoAcciones';
import {
  activosDeEmpresa,
  responsablesDeEmpresa,
  todayIsoDate,
  usuariosDeEmpresa,
} from '@/features/inventario/trasladoRuta';
import { RecordFormOverlay } from '@/shared/components/RecordFormOverlay';
import {
  asOptions,
  compactErrors,
  optionalText,
  requireSelect,
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
  idEmpresaActiva,
  ubicaciones = [],
  sedes = [],
  areas = [],
  onSave,
  onClose,
}) {
  const lockActivo = Boolean(prefill?.idActivo);
  const ctx = { asignaciones, tipos };
  const activosElegibles = useMemo(
    () =>
      activosDeEmpresa(
        (activos ?? []).filter((item) => {
          const lookup = { asignaciones, tipos };
          return (
            !isActivoDeBaja(item, lookup) &&
            !isActivoEnMantenimiento(item, lookup) &&
            !isActivoAsignado(item, lookup)
          );
        }),
        ubicaciones,
        sedes,
        idEmpresaActiva,
      ),
    [activos, asignaciones, idEmpresaActiva, sedes, tipos, ubicaciones],
  );
  const responsablesFiltrados = useMemo(
    () => responsablesDeEmpresa(responsables, areas, sedes, idEmpresaActiva),
    [areas, idEmpresaActiva, responsables, sedes],
  );
  const usuariosFiltrados = useMemo(
    () => usuariosDeEmpresa(usuarios, idEmpresaActiva),
    [idEmpresaActiva, usuarios],
  );

  const usuarioOptions = useMemo(
    () => asOptions(usuariosFiltrados.map((item) => ({ id: item.id, nombre: usuarioNombre(item) }))),
    [usuariosFiltrados],
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
        hint: 'Solo activos libres de la empresa activa.',
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
        hint: usuariosUnavailableReason || 'Solo usuarios de la empresa activa.',
      },
      {
        name: 'idResponsable',
        label: 'Responsable',
        type: 'select',
        required: true,
        options: asOptions(responsablesFiltrados, 'nombreCompleto'),
        hint: 'Solo responsables de la empresa activa.',
      },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
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
    [
      activos,
      activosElegibles,
      lockActivo,
      motivos,
      responsablesFiltrados,
      usuarioOptions,
      usuariosUnavailableReason,
    ],
  );

  return (
    <RecordFormOverlay
      key={`baja-${prefill?.idActivo ?? 'nueva'}`}
      open={open}
      title="Registrar baja"
      kicker="Operaciones"
      hint="Indique el motivo y quien autoriza la baja."
      fields={fields}
      initialValues={{
        idActivo: prefill?.idActivo ? String(prefill.idActivo) : '',
        idMotivoBaja: '',
        idAutorizadoPor: prefill?.idAutorizadoPor ? String(prefill.idAutorizadoPor) : '',
        idResponsable: prefill?.idResponsable ? String(prefill.idResponsable) : '',
        fecha: todayIsoDate(),
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
