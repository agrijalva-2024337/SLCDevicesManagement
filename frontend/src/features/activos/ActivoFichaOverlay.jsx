import { useCallback, useMemo } from 'react';
import { estadoNombreDeActivo, getAccionesDisponibles, isActivoDeBaja } from '@/features/activos/activoAcciones';
import { ActivoMovimientosTimeline } from '@/features/activos/ActivoMovimientosTimeline';
import * as historialActivoService from '@/features/activos/historialActivoService';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { EditRecordButton } from '@/shared/components/RecordActions';
import { RowIconActions } from '@/shared/components/RowIconActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate, formatMoney } from '@/shared/utils/format';

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
  categorias,
  proveedores,
  ubicaciones,
  sedes,
  empresas,
  asignaciones,
  tipos,
  estados,
  canWrite,
  onClose,
  onEditar,
  onAsignar,
  onTrasladar,
  onMantenimiento,
  children,
}) {
  const ubicacion = byId(ubicaciones, activo?.idUbicacion);
  const sede = byId(sedes, ubicacion?.idSede);
  const empresa = byId(empresas, sede?.idEmpresa);
  const categoria = byId(categorias, activo?.idCategoriaActivo);
  const proveedor = byId(proveedores, activo?.idProveedor);
  const estadoNombre = estadoNombreDeActivo(activo, { asignaciones, estados });
  const activoId = activo?.id;
  const revision = `${activoId ?? ''}:${(asignaciones ?? []).length}`;
  const loadMovimientos = useCallback(
    () => (activoId ? historialActivoService.listarPorActivo(activoId, revision) : Promise.resolve([])),
    [activoId, revision],
  );
  const movimientos = useResource(loadMovimientos);
  const acciones = useMemo(() => {
    if (!activo) return [];
    const all = getAccionesDisponibles(activo, { asignaciones, tipos });
    if (canWrite) return all.filter((item) => item.key !== 'view' && item.key !== 'edit');
    return [];
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
            <DetailField label="Categoría" value={categoria?.nombre} />
            <DetailField label="Marca / modelo" value={[activo.marca, activo.modelo].filter(Boolean).join(' ')} />
            <DetailField label="Proveedor" value={proveedor?.nombre} />
            <DetailField label="Empresa" value={empresa?.nombre} />
            <DetailField label="Sede" value={sede?.nombre} />
            <DetailField label="Ubicación" value={nombreUbicacion(ubicacion)} />
            <DetailField label="Estado" value={estadoNombre} />
            <DetailField label="Fecha de compra" value={formatDate(activo.fechaCompra)} />
            <DetailField label="Costo" value={formatMoney(activo.costoAdquisicion, activo.moneda ?? 'GTQ')} />
            <DetailField label="Factura" value={activo.numeroFactura} />
            <DetailField label="Garantía hasta" value={formatDate(activo.fechaVencimientoGarantia)} />
            <div className="sm:col-span-2">
              <DetailField label="Descripción" value={activo.descripcion} />
            </div>
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={activo.observaciones} />
            </div>
          </div>
          {canWrite && !isActivoDeBaja(activo, { asignaciones, tipos }) ? (
            <div className="flex flex-wrap gap-3">
              <EditRecordButton onClick={() => onEditar?.(activo)} />
            </div>
          ) : null}
          {acciones.length ? (
            <div>
              <p className="app-label">Acciones</p>
              <div className="mt-2">
                <RowIconActions
                  actions={acciones}
                  onAction={(action) => {
                    if (action.key === 'assign') onAsignar?.(activo);
                    if (action.key === 'transfer') onTrasladar?.(activo);
                    if (action.key === 'maintenance') onMantenimiento?.(activo);
                  }}
                />
              </div>
            </div>
          ) : null}
          <div>
            <p className="app-label">Línea de tiempo</p>
            <div className="mt-3">
              <ActivoMovimientosTimeline movimientos={movimientos.data} loading={movimientos.isLoading} />
            </div>
          </div>
          {children}
        </>
      ) : null}
    </DetailOverlay>
  );
}
