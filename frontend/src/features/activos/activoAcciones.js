import { TIPO_ASIGNACION, nombresCatalogoIguales } from '@/shared/api/tipoAsignacion';

function idDeTipo(tipos, nombre) {
  return (tipos ?? []).find((item) => nombresCatalogoIguales(item.nombre, nombre))?.id ?? null;
}

export function asignacionActivaDe(activo, asignaciones) {
  return (asignaciones ?? []).find(
    (row) => Number(row.idActivo) === Number(activo?.id) && row.activa,
  ) ?? null;
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

export function getAccionesDisponibles(activo, ctx = {}) {
  const baja = isActivoDeBaja(activo, ctx);
  const mantenimiento = isActivoEnMantenimiento(activo, ctx);
  const bajaReason = 'El activo está dado de baja. No se traslada ni se envía a mantenimiento.';
  const mantReason = 'El activo está en mantenimiento. Finalícelo antes de continuar.';

  return [
    {
      key: 'transfer',
      icon: 'pi pi-arrow-right-arrow-left',
      label: 'Trasladar',
      tone: 'view',
      enabled: !baja && !mantenimiento,
      disabledReason: baja ? bajaReason : mantenimiento ? mantReason : undefined,
    },
    {
      key: 'maintenance',
      icon: 'pi pi-wrench',
      label: 'Mantenimiento',
      tone: 'warning',
      enabled: !baja && !mantenimiento,
      disabledReason: baja ? bajaReason : mantenimiento ? 'El activo ya está en mantenimiento.' : undefined,
    },
  ];
}
