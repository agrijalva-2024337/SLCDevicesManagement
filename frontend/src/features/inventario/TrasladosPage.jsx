import { useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { TrasladoFormOverlay } from '@/features/inventario/TrasladoFormOverlay';
import * as trasladoService from '@/features/inventario/trasladoService';
import { parseTrasladoRuta } from '@/features/inventario/trasladoRuta';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { RegisterButton } from '@/shared/components/RecordActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { formatDate, byId } from '@/shared/utils/format';

function hydrate(row, lookups) {
  const ruta = parseTrasladoRuta(row.observaciones);
  const activo = byId(lookups.activos, row.idActivo);
  const estado = byId(lookups.estados, row.idEstado);
  const responsable = byId(lookups.responsables, row.idResponsable);
  return {
    ...row,
    activoNombre: activo?.nombre ?? `Activo #${row.idActivo}`,
    origen: ruta.origen ?? '—',
    destino: ruta.destino ?? '—',
    estadoNombre: estado?.nombre ?? '—',
    responsableNombre: responsable?.nombreCompleto ?? '—',
  };
}

function estadoTone(nombre) {
  if (!nombre) return 'muted';
  const key = nombre.toLowerCase();
  if (key.includes('disponible') || key.includes('asignado')) return 'success';
  if (key.includes('mantenimiento')) return 'warning';
  if (key.includes('baja')) return 'danger';
  return 'info';
}

export function TrasladosPage() {
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('traslados');
  const { idActiva } = useEmpresaActiva();
  const load = useCallback(() => trasladoService.listar(), []);
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(load);
  const crud = useCrudOverlay();
  const activos = useResource(activoService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);
  const estados = useResource(estadoService.getAll);
  const responsables = useResource(responsableService.getAll);
  const tipos = useResource(tipoAsignacionService.getAll);
  const asignaciones = useResource(asignacionService.getAll);

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

  const estadoOptions = useMemo(() => {
    const names = [...new Set(tableRows.map((row) => row.estadoNombre).filter((name) => name && name !== '—'))];
    return [{ value: 'all', label: 'Todos' }, ...names.map((name) => ({ value: name, label: name }))];
  }, [tableRows]);

  const columns = useMemo(
    () => [
      { key: 'activoNombre', header: 'Activo', primary: true },
      {
        key: 'origen',
        header: 'Origen',
        pairWith: { key: 'destino', header: 'Destino' },
      },
      { key: 'responsableNombre', header: 'Responsable' },
      {
        key: 'fechaAsignacion',
        header: 'Fecha',
        getValue: (row) => formatDate(row.fechaAsignacion),
        sortValue: (row) => row.fechaAsignacion,
      },
      {
        key: 'estadoNombre',
        header: 'Estado',
        type: 'badge',
        tone: (row) => estadoTone(row.estadoNombre),
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
        title="Traslados"
        description="Movimientos entre ubicaciones de la misma empresa. Se registran como filas de Asignación con tipo Traslado."
        primaryAction={
          allowWrite ? <RegisterButton label="Registrar traslado" onClick={() => crud.openCreate()} /> : null
        }
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo, origen, destino o responsable"
        statusFilter={{
          key: 'estadoNombre',
          label: 'Estado',
          options: estadoOptions,
        }}
        emptyTitle="No hay traslados"
        emptyDescription="Registre el primer traslado eligiendo un destino de la empresa activa."
        getRowActions={(row) => ({
          view: { onClick: () => crud.openView(row) },
        })}
      />

      <DetailOverlay
        open={crud.isView}
        title={crud.record?.activoNombre ?? 'Traslado'}
        kicker="Traslado"
        badge={
          crud.record ? (
            <ToneBadge tone={estadoTone(crud.record.estadoNombre)}>{crud.record.estadoNombre}</ToneBadge>
          ) : null
        }
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Activo" value={crud.record.activoNombre} />
            <DetailField label="Responsable" value={crud.record.responsableNombre} />
            <DetailField label="Origen" value={crud.record.origen} />
            <DetailField label="Destino" value={crud.record.destino} />
            <DetailField label="Fecha" value={formatDate(crud.record.fechaAsignacion)} />
            <DetailField label="Estado" value={crud.record.estadoNombre} />
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={crud.record.observaciones} />
            </div>
          </div>
        ) : null}
      </DetailOverlay>

      <TrasladoFormOverlay
        open={crud.isCreate}
        prefill={crud.record}
        activos={lookups.activos}
        ubicaciones={lookups.ubicaciones}
        sedes={lookups.sedes}
        responsables={lookups.responsables}
        asignaciones={asignaciones.data}
        tipos={tipos.data}
        idEmpresaActiva={idActiva}
        onClose={crud.close}
        onSave={async (values) => {
          await trasladoService.registrar({
            idActivo: Number(values.idActivo),
            idUbicacionDestino: Number(values.idUbicacionDestino),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
          });
          setBanner({ message: 'Traslado registrado.', variant: 'empty' });
          crud.close();
          await reload();
          await activos.reload();
        }}
      />
    </section>
  );
}
