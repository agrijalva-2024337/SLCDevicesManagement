import { TIPO_ASIGNACION, nombresCatalogoIguales } from '@/shared/api/tipoAsignacion';

function idDeTipo(tipos, nombre) {
  return (tipos ?? []).find((item) => nombresCatalogoIguales(item.nombre, nombre))?.id ?? null;
}

export function asignacionActivaDe(activo, asignaciones) {
  return (
    (asignaciones ?? []).find((row) => Number(row.idActivo) === Number(activo?.id) && row.activa) ?? null
  );
}

export function isActivoAsignado(activo, { asignaciones = [], tipos = [] } = {}) {
  const idTipo = idDeTipo(tipos, TIPO_ASIGNACION.Asignacion);
  if (idTipo == null) return false;
  return (asignaciones ?? []).some(
    (row) =>
      Number(row.idActivo) === Number(activo.id) &&
      row.activa &&
      Number(row.idTipoAsignacion) === Number(idTipo),
  );
}

export function isActivoEnMantenimiento(activo, { asignaciones = [], tipos = [] } = {}) {
  const idTipo = idDeTipo(tipos, TIPO_ASIGNACION.Mantenimiento);
  if (idTipo == null) return false;
  return (asignaciones ?? []).some(
    (row) =>
      Number(row.idActivo) === Number(activo.id) &&
      row.activa &&
      Number(row.idTipoAsignacion) === Number(idTipo),
  );
}

export function isActivoDeBaja(activo, { asignaciones = [], tipos = [] } = {}) {
  const idTipo = idDeTipo(tipos, TIPO_ASIGNACION.Baja);
  if (idTipo == null) return false;
  return (asignaciones ?? []).some(
    (row) =>
      Number(row.idActivo) === Number(activo.id) &&
      row.activa &&
      Number(row.idTipoAsignacion) === Number(idTipo),
  );
}

export function estadoNombreDeActivo(activo, { asignaciones = [], estados = [] } = {}) {
  if (activo?.idEstado != null && activo.idEstado !== '') {
    return (estados ?? []).find((item) => Number(item.id) === Number(activo.idEstado))?.nombre ?? null;
  }
  const activa = (asignaciones ?? []).find(
    (row) => Number(row.idActivo) === Number(activo?.id) && row.activa,
  );
  if (!activa) return 'Disponible';
  return (estados ?? []).find((item) => Number(item.id) === Number(activa.idEstado))?.nombre ?? '—';
}

export function getAccionesDisponibles(activo, ctx = {}) {
  const baja = isActivoDeBaja(activo, ctx);
  const mantenimiento = isActivoEnMantenimiento(activo, ctx);
  const asignado = isActivoAsignado(activo, ctx);
  const bajaReason = 'El activo está dado de baja.';
  const mantReason = 'El activo está en mantenimiento. Finalícelo antes de continuar.';

  return [
    { key: 'view', label: 'Ver ficha', icon: 'pi pi-eye', tone: 'view', enabled: true },
    {
      key: 'edit',
      label: 'Editar',
      icon: 'pi pi-pencil',
      tone: 'edit',
      enabled: !baja,
      disabledReason: baja ? `${bajaReason} No se edita.` : undefined,
    },
    {
      key: 'assign',
      label: 'Asignar',
      icon: 'pi pi-user-plus',
      tone: 'info',
      enabled: !baja && !mantenimiento && !asignado,
      disabledReason: baja
        ? `${bajaReason} No se puede asignar.`
        : mantenimiento
          ? mantReason
          : asignado
            ? 'El activo ya tiene una asignación activa.'
            : undefined,
    },
    {
      key: 'transfer',
      label: 'Trasladar',
      icon: 'pi pi-arrow-right-arrow-left',
      tone: 'view',
      enabled: !baja && !mantenimiento,
      disabledReason: baja ? `${bajaReason} No se puede trasladar.` : mantReason,
    },
    {
      key: 'maintenance',
      label: 'Mantenimiento',
      icon: 'pi pi-wrench',
      tone: 'warning',
      enabled: !baja && !mantenimiento,
      disabledReason: baja ? `${bajaReason} No admite mantenimiento.` : 'El activo ya está en mantenimiento.',
    },
    {
      key: 'retire',
      label: 'Dar de baja',
      icon: 'pi pi-times-circle',
      tone: 'danger',
      enabled: false,
      disabledReason: 'La baja se registra en el Sprint 7 (BE-18).',
    },
  ];
}
