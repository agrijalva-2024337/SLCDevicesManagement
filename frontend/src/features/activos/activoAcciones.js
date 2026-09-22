import { TIPO_ASIGNACION, nombresCatalogoIguales } from '@/shared/api/tipoAsignacion';

function idsDeTipo(tipos, nombre) {
  return new Set(
    (tipos ?? [])
      .filter((item) => nombresCatalogoIguales(item.nombre, nombre))
      .map((item) => Number(item.id)),
  );
}

export function indexTipos(tipos) {
  return {
    asignacion: idsDeTipo(tipos, TIPO_ASIGNACION.Asignacion),
    mantenimiento: idsDeTipo(tipos, TIPO_ASIGNACION.Mantenimiento),
    baja: idsDeTipo(tipos, TIPO_ASIGNACION.Baja),
  };
}

export function indexAsignacionesActivas(asignaciones) {
  const byActivo = new Map();
  for (const row of asignaciones ?? []) {
    if (!row.activa) continue;
    byActivo.set(Number(row.idActivo), row);
  }
  return byActivo;
}

function tipoIdsDe(ctx, kind) {
  const fromIndex = ctx?.tipoIds?.[kind];
  if (fromIndex instanceof Set) return fromIndex;
  if (fromIndex != null && fromIndex !== '') return new Set([Number(fromIndex)]);
  const nombre =
    kind === 'mantenimiento'
      ? TIPO_ASIGNACION.Mantenimiento
      : kind === 'baja'
        ? TIPO_ASIGNACION.Baja
        : TIPO_ASIGNACION.Asignacion;
  return idsDeTipo(ctx?.tipos, nombre);
}

function activaDe(activo, ctx = {}) {
  if (ctx.asignacionesPorActivo) {
    return ctx.asignacionesPorActivo.get(Number(activo?.id)) ?? null;
  }
  return asignacionActivaDe(activo, ctx.asignaciones);
}

export function asignacionActivaDe(activo, asignaciones) {
  if (asignaciones instanceof Map) {
    return asignaciones.get(Number(activo?.id)) ?? null;
  }
  return (
    (asignaciones ?? []).find((row) => Number(row.idActivo) === Number(activo?.id) && row.activa) ?? null
  );
}

export function isActivoAsignado(activo, ctx = {}) {
  const ids = tipoIdsDe(ctx, 'asignacion');
  if (ids.size === 0) return false;
  const row = activaDe(activo, ctx);
  return Boolean(row && ids.has(Number(row.idTipoAsignacion)));
}

export function isActivoEnMantenimiento(activo, ctx = {}) {
  const ids = tipoIdsDe(ctx, 'mantenimiento');
  if (ids.size === 0) return false;
  const row = activaDe(activo, ctx);
  return Boolean(row && ids.has(Number(row.idTipoAsignacion)));
}

export function isActivoDeBaja(activo, ctx = {}) {
  const ids = tipoIdsDe(ctx, 'baja');
  if (ids.size === 0) return false;
  const row = activaDe(activo, ctx);
  return Boolean(row && ids.has(Number(row.idTipoAsignacion)));
}

export function estadoNombreDeActivo(activo, { asignaciones = [], estados = [], asignacionesPorActivo } = {}) {
  if (activo?.idEstado != null && activo.idEstado !== '') {
    return (estados ?? []).find((item) => Number(item.id) === Number(activo.idEstado))?.nombre ?? null;
  }
  const activa = asignacionesPorActivo
    ? (asignacionesPorActivo.get(Number(activo?.id)) ?? null)
    : (asignaciones ?? []).find((row) => Number(row.idActivo) === Number(activo?.id) && row.activa);
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
    { key: 'qr', label: 'Ver código QR', icon: 'pi pi-qrcode', tone: 'view', enabled: true },
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
      enabled: !baja && !mantenimiento && !asignado,
      disabledReason: baja
        ? `${bajaReason} No admite mantenimiento.`
        : mantenimiento
          ? 'El activo ya está en mantenimiento.'
          : asignado
            ? 'El activo tiene una asignación activa. Devuélvalo antes de enviarlo a mantenimiento.'
            : undefined,
    },
    {
      key: 'retire',
      label: 'Dar de baja',
      icon: 'pi pi-times-circle',
      tone: 'danger',
      enabled: Boolean(ctx.canRetire) && !baja && !mantenimiento && !asignado,
      disabledReason: !ctx.canRetire
        ? 'Solo un administrador de empresa puede dar de baja.'
        : baja
          ? `${bajaReason} Ya está dada de baja.`
          : asignado
            ? 'El activo tiene una asignación activa. Cierren el proceso antes de dar de baja.'
            : mantenimiento
              ? 'El activo está en mantenimiento. Finalícelo antes de dar de baja.'
              : undefined,
    },
  ];
}
