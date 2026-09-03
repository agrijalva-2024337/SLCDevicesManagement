import { useMemo } from 'react';
import { getAccionesDisponibles } from '@/features/activos/activoAcciones';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { RowIconActions } from '@/shared/components/RowIconActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { formatDate, formatMoney, byId } from '@/shared/utils/format';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';

function estadoDelActivo(activo, { asignaciones, estados }) {
  if (activo?.idEstado) {
    return byId(estados, activo.idEstado)?.nombre ?? null;
  }
  const activa = (asignaciones ?? []).find((row) => Number(row.idActivo) === Number(activo?.id) && row.activa);
  if (!activa) return 'Disponible';
  return byId(estados, activa.idEstado)?.nombre ?? '—';
}

function estadoTone(nombre) {
  const key = String(nombre ?? '').toLowerCase();
  if (key.includes('baja')) return 'danger';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('asignado')) return 'info';
  return 'success';
}

export function ActivoFichaOverlay({
  open,
  activo,
  ubicaciones,
  asignaciones,
  tipos,
  estados,
  canWrite,
  onClose,
  onTrasladar,
  onMantenimiento,
  children,
}) {
  const ubicacion = byId(ubicaciones, activo?.idUbicacion);
  const estadoNombre = estadoDelActivo(activo, { asignaciones, estados });
  const acciones = useMemo(() => {
    if (!activo || !canWrite) return [];
    return getAccionesDisponibles(activo, { asignaciones, tipos });
  }, [activo, asignaciones, canWrite, tipos]);

  return (
    <DetailOverlay
      open={open}
      title={activo?.nombre ?? 'Activo'}
      kicker="Activo"
      badge={estadoNombre ? <ToneBadge tone={estadoTone(estadoNombre)}>{estadoNombre}</ToneBadge> : null}
      onClose={onClose}
    >
      {activo ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Número de serie" value={activo.numeroSerie} />
            <DetailField label="Marca / modelo" value={[activo.marca, activo.modelo].filter(Boolean).join(' ')} />
            <DetailField label="Ubicación" value={nombreUbicacion(ubicacion)} />
            <DetailField label="Estado" value={estadoNombre} />
            <DetailField label="Fecha de compra" value={formatDate(activo.fechaCompra)} />
            <DetailField label="Costo" value={formatMoney(activo.costoAdquisicion, activo.moneda ?? 'GTQ')} />
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={activo.observaciones} />
            </div>
          </div>
          {acciones.length ? (
            <div>
              <p className="app-label">Acciones</p>
              <div className="mt-2">
                <RowIconActions
                  actions={acciones}
                  onAction={(action) => {
                    if (action.key === 'transfer') onTrasladar?.(activo);
                    if (action.key === 'maintenance') onMantenimiento?.(activo);
                  }}
                />
              </div>
            </div>
          ) : null}
          {children}
        </>
      ) : null}
    </DetailOverlay>
  );
}
