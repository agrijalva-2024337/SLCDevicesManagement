import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { MantenimientoFormOverlay } from '@/features/mantenimientos/MantenimientoFormOverlay';
import * as mantenimientoService from '@/features/mantenimientos/mantenimientoService';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { RegisterButton } from '@/shared/components/RecordActions';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';

function sedeLabel(activo, ubicaciones, sedes) {
  const ubicacion = byId(ubicaciones, activo?.idUbicacion);
  const sede = byId(sedes, ubicacion?.idSede);
  if (!ubicacion) return '—';
  return sede ? `${sede.nombre} · ${nombreUbicacion(ubicacion)}` : nombreUbicacion(ubicacion);
}

function hydrate(row, lookups) {
  const activo = byId(lookups.activos, row.idActivo);
  const estado = byId(lookups.estados, row.idEstado);
  const responsable = byId(lookups.responsables, row.idResponsable);
  return {
    ...row,
    activoNombre: activo?.nombre ?? `Activo #${row.idActivo}`,
    estadoNombre: estado?.nombre ?? '—',
    responsableNombre: responsable?.nombreCompleto ?? '—',
    sedeNombre: sedeLabel(activo, lookups.ubicaciones, lookups.sedes),
    abierto: mantenimientoService.estaAbierto(row),
  };
}

export function MantenimientosPage() {
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('mantenimientos');
  const [params] = useSearchParams();
  const load = useCallback(() => mantenimientoService.listar(), []);
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(load);
  const crud = useCrudOverlay();
  const [closing, setClosing] = useState(false);
  const activos = useResource(activoService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignacionesAll = useResource(asignacionService.getAll);

  const lookups = useMemo(
    () => ({
      activos: activos.data,
      ubicaciones: ubicaciones.data,
      sedes: sedes.data,
      estados: estados.data,
      responsables: responsables.data,
    }),
    [activos.data, ubicaciones.data, sedes.data, estados.data, responsables.data],
  );

  const tableRows = useMemo(() => rows.map((row) => hydrate(row, lookups)), [lookups, rows]);
  useRecordDeepLink(tableRows, crud.openView);

  const estadoParam = params.get('estado');
  const abiertos = params.get('abiertos') === '1';
  const initialFilters = useMemo(
    () => ({
      estadoNombre: estadoParam || 'all',
      abierto: abiertos ? 'true' : 'all',
    }),
    [abiertos, estadoParam],
  );

  const estadoOptions = useMemo(() => {
    const names = [...new Set(tableRows.map((row) => row.estadoNombre).filter((name) => name && name !== '—'))];
    return [{ value: 'all', label: 'Todos' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [tableRows]);

  const columns = useMemo(
    () => [
      { key: 'activoNombre', header: 'Activo', primary: true },
      { key: 'sedeNombre', header: 'Sede' },
      { key: 'responsableNombre', header: 'Responsable' },
      {
        key: 'fechaAsignacion',
        header: 'Apertura',
        getValue: (row) => formatDate(row.fechaAsignacion),
        sortValue: (row) => row.fechaAsignacion,
      },
      {
        key: 'estadoNombre',
        header: 'Estado',
        type: 'badge',
        tone: (row) => (row.abierto ? 'warning' : 'success'),
      },
      {
        key: 'abierto',
        header: 'Orden',
        type: 'status',
        activeLabel: 'Abierta',
        inactiveLabel: 'Cerrada',
        tone: 'warning',
      },
    ],
    [],
  );

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  return (
    <section>
      {banner ? (
        <div
          className={`app-feedback ${banner.variant === 'error' ? 'app-feedback--error' : 'app-feedback--empty'}`}
          role={banner.variant === 'error' ? 'alert' : 'status'}
        >
          {banner.message}
        </div>
      ) : null}
      <DataTable
        title="Mantenimientos"
        description="Órdenes sobre Asignación con tipo Mantenimiento. Use ?abiertos=1 o ?estado= para el drill-down del dashboard."
        primaryAction={
          allowWrite ? (
            <RegisterButton label="Abrir mantenimiento" onClick={() => crud.openCreate()} />
          ) : null
        }
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo, sede o responsable"
        statusFilter={{
          key: 'estadoNombre',
          label: 'Estado',
          options: estadoOptions,
        }}
        filters={[
          {
            key: 'abierto',
            label: 'Apertura',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'true', label: 'Abiertos' },
              { value: 'false', label: 'Cerrados' },
            ],
          },
        ]}
        initialFilters={initialFilters}
        emptyTitle="No hay mantenimientos"
        emptyDescription="Abra la primera orden de mantenimiento."
        getRowActions={(row) => ({
          view: { onClick: () => crud.openView(row) },
        })}
      />

      <DetailOverlay
        open={crud.isView}
        title={crud.record?.activoNombre ?? 'Mantenimiento'}
        kicker="Mantenimiento"
        badge={
          crud.record ? (
            <StatusBadge
              active={crud.record.abierto}
              activeLabel="Abierta"
              inactiveLabel="Cerrada"
              tone={crud.record.abierto ? 'warning' : 'default'}
            />
          ) : null
        }
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Activo" value={crud.record.activoNombre} />
            <DetailField label="Sede" value={crud.record.sedeNombre} />
            <DetailField label="Responsable" value={crud.record.responsableNombre} />
            <DetailField label="Estado" value={crud.record.estadoNombre} />
            <DetailField label="Apertura" value={formatDate(crud.record.fechaAsignacion)} />
            <DetailField label="Cierre" value={formatDate(crud.record.fechaDevolucion)} />
            <div className="sm:col-span-2">
              <DetailField label="Detalle" value={crud.record.observaciones} />
            </div>
            {allowWrite && crud.record.abierto ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  disabled={closing}
                  onClick={async () => {
                    setClosing(true);
                    try {
                      await mantenimientoService.finalizar(crud.record.id);
                      setBanner({ message: 'Mantenimiento finalizado. El activo vuelve a Disponible.', variant: 'empty' });
                      crud.close();
                      await reload();
                      await activos.reload();
                    } finally {
                      setClosing(false);
                    }
                  }}
                >
                  <i className="pi pi-check" aria-hidden="true" />
                  {closing ? 'Finalizando…' : 'Finalizar mantenimiento'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailOverlay>

      <MantenimientoFormOverlay
        open={crud.isCreate}
        prefill={crud.record}
        activos={lookups.activos}
        ubicaciones={lookups.ubicaciones}
        sedes={lookups.sedes}
        responsables={lookups.responsables}
        asignaciones={asignacionesAll.data}
        tipos={tipos.data}
        onClose={crud.close}
        onSave={async (values) => {
          await mantenimientoService.registrar({
            idActivo: Number(values.idActivo),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
          });
          setBanner({ message: 'Mantenimiento abierto.', variant: 'empty' });
          crud.close();
          await reload();
          await activos.reload();
        }}
      />
    </section>
  );
}
