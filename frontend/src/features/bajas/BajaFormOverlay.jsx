import { useMemo } from 'react';
import {
  indexAsignacionesActivas,
  indexTipos,
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
  permiteElegirAutorizador = true,
  usuarioActual,
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
          const lookup = {
            asignaciones,
            tipos,
            tipoIds: indexTipos(tipos),
            asignacionesPorActivo: indexAsignacionesActivas(asignaciones),
          };
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

  const idAutorizadoPorFijo =
    !permiteElegirAutorizador && usuarioActual?.id != null ? String(usuarioActual.id) : '';

  const fields = useMemo(() => {
    const base = [
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
    ];

    if (permiteElegirAutorizador) {
      base.push({
        name: 'idAutorizadoPor',
        label: 'Autorizado por',
        type: 'select',
        required: !usuariosUnavailableReason,
        readOnly: Boolean(usuariosUnavailableReason),
        options: usuarioOptions,
        hint: usuariosUnavailableReason || 'Solo usuarios de la empresa activa.',
      });
    }

    base.push(
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
    );

    return base;
  }, [
    activos,
    activosElegibles,
    lockActivo,
    motivos,
    permiteElegirAutorizador,
    responsablesFiltrados,
    usuarioOptions,
    usuariosUnavailableReason,
  ]);

  return (
    <RecordFormOverlay
      key={`baja-${prefill?.idActivo ?? 'nueva'}`}
      open={open}
      title="Registrar baja"
      kicker="Operaciones"
      hint={
        permiteElegirAutorizador
          ? 'Indique el motivo y quien autoriza la baja.'
          : 'Indique el motivo de la baja. Quien autoriza queda registrado como usted.'
      }
      fields={fields}
      initialValues={{
        idActivo: prefill?.idActivo ? String(prefill.idActivo) : '',
        idMotivoBaja: '',
        idAutorizadoPor: permiteElegirAutorizador
          ? prefill?.idAutorizadoPor
            ? String(prefill.idAutorizadoPor)
            : ''
          : idAutorizadoPorFijo,
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
          idAutorizadoPor: permiteElegirAutorizador
            ? usuariosUnavailableReason || requireSelect(values.idAutorizadoPor, 'quien autoriza')
            : idAutorizadoPorFijo
              ? null
              : 'No se pudo determinar el usuario actual.',
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
      onSave={async (values) => {
        const payload = permiteElegirAutorizador
          ? values
          : { ...values, idAutorizadoPor: idAutorizadoPorFijo };
        return onSave?.(payload);
      }}
      onClose={onClose}
      submitLabel="Registrar baja"
    />
  );
}
