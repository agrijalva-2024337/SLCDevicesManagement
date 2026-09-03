import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as activoService from '@/features/activos/activoService';
import { AsignacionFormOverlay } from '@/features/asignaciones/AsignacionFormOverlay';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { empresaIdDeActivo, nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as estadoService from '@/features/organizacion/estados/estadoService';
import * as responsableService from '@/features/organizacion/responsables/responsableService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { RegisterButton } from '@/shared/components/RecordActions';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';

const ESTADOS_VISTA = ['Vigente', 'Devuelta'];

function estadoVista(row) {
  return asignacionService.estaVigente(row) ? 'Vigente' : 'Devuelta';
}

function estadoTone(estado) {
  return estado === 'Vigente' ? 'success' : 'muted';
}

function hydrate(row, lookups) {
  const activo = byId(lookups.activos, row.idActivo);
  const responsable = byId(lookups.responsables, row.idResponsable);
  const ubicacion = byId(lookups.ubicaciones, activo?.idUbicacion);
  return {
    ...row,
    activoNombre: activo?.nombre ?? `Activo #${row.idActivo}`,
    responsableNombre: responsable?.nombreCompleto ?? '—',
    ubicacionNombre: nombreUbicacion(ubicacion),
    estadoVista: estadoVista(row),
  };
}

export function AsignacionesPage() {
  const { canWrite, usuario } = useAuth();
  const allowWrite = canWrite('asignaciones');
  const { idActiva } = useEmpresaActiva();
  const location = useLocation();
  const navigate = useNavigate();
  const load = useCallback(() => asignacionService.listarEntregas(), []);
  const { rows, isLoading, errorMessage, banner, setBanner, reload } = useCatalogCollection(load);
  const crud = useCrudOverlay();
  const [closing, setClosing] = useState(false);
  const prefillOpened = useRef(false);
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
    [activos.data, estados.data, responsables.data, sedes.data, ubicaciones.data],
  );

  const scopedRows = useMemo(() => {
    if (idActiva == null || idActiva === '') return rows;
    return rows.filter((row) => {
      const activo = byId(lookups.activos, row.idActivo);
      return empresaIdDeActivo(activo, lookups.ubicaciones, lookups.sedes) === Number(idActiva);
    });
  }, [idActiva, lookups.activos, lookups.sedes, lookups.ubicaciones, rows]);

  const tableRows = useMemo(() => scopedRows.map((row) => hydrate(row, lookups)), [lookups, scopedRows]);
  useRecordDeepLink(tableRows, crud.openView);

  useEffect(() => {
    if (prefillOpened.current || !allowWrite) return;
    const idActivo = location.state?.idActivo;
    if (idActivo == null || idActivo === '') return;
    prefillOpened.current = true;
    crud.openCreate({ idActivo });
    navigate(location.pathname, { replace: true, state: {} });
    // openCreate es estable en la práctica; el ref evita reabrir al re-renderizar.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo reacciona al state de navegación
  }, [allowWrite, location.pathname, location.state, navigate]);

  const responsableOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos' },
      ...[...new Set(tableRows.map((row) => row.responsableNombre).filter((name) => name && name !== '—'))].map(
        (name) => ({ value: name, label: name }),
      ),
    ],
    [tableRows],
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
        title="Asignaciones"
        description="Entrega y devolución. Solo filas de tipo Asignacion. Traslado y mantenimiento viven en sus propias pantallas."
        primaryAction={
          allowWrite ? <RegisterButton label="Registrar asignación" onClick={() => crud.openCreate()} /> : null
        }
        columns={[
          { key: 'activoNombre', header: 'Activo', primary: true },
          { key: 'responsableNombre', header: 'Responsable' },
          { key: 'ubicacionNombre', header: 'Ubicación' },
          {
            key: 'estadoVista',
            header: 'Estado',
            type: 'badge',
            tone: (row) => estadoTone(row.estadoVista),
          },
          {
            key: 'fechaAsignacion',
            header: 'Entrega',
            getValue: (row) => formatDate(row.fechaAsignacion),
            sortValue: (row) => row.fechaAsignacion,
          },
          {
            key: 'fechaDevolucion',
            header: 'Devolución',
            getValue: (row) => formatDate(row.fechaDevolucion),
            sortValue: (row) => row.fechaDevolucion,
          },
        ]}
        rows={tableRows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo, responsable o ubicación"
        statusFilter={{
          key: 'estadoVista',
          label: 'Estado',
          options: [
            { value: 'all', label: 'Todos' },
            ...ESTADOS_VISTA.map((estado) => ({ value: estado, label: estado })),
          ],
        }}
        filters={[
          {
            key: 'responsableNombre',
            label: 'Responsable',
            options: responsableOptions,
          },
        ]}
        emptyTitle="No hay asignaciones"
        emptyDescription="Registre la primera entrega para asignar un activo a un responsable."
        getRowActions={(row) => ({
          view: { onClick: () => crud.openView(row) },
        })}
      />

      <DetailOverlay
        open={crud.isView}
        title={crud.record?.activoNombre ?? 'Asignación'}
        kicker="Asignación"
        badge={
          crud.record ? (
            <ToneBadge tone={estadoTone(crud.record.estadoVista)}>{crud.record.estadoVista}</ToneBadge>
          ) : null
        }
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Activo" value={crud.record.activoNombre} />
            <DetailField label="Responsable" value={crud.record.responsableNombre} />
            <DetailField label="Ubicación" value={crud.record.ubicacionNombre} />
            <DetailField label="Estado" value={crud.record.estadoVista} />
            <DetailField label="Fecha de entrega" value={formatDate(crud.record.fechaAsignacion)} />
            <DetailField label="Fecha de devolución" value={formatDate(crud.record.fechaDevolucion)} />
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={crud.record.observaciones} />
            </div>
            {allowWrite && asignacionService.estaVigente(crud.record) ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  disabled={closing}
                  onClick={async () => {
                    setClosing(true);
                    try {
                      await asignacionService.devolver(crud.record.id);
                      setBanner({ message: 'Activo devuelto. El estado vuelve a Disponible.', variant: 'empty' });
                      crud.close();
                      await reload();
                      await activos.reload();
                      await asignacionesAll.reload();
                    } finally {
                      setClosing(false);
                    }
                  }}
                >
                  <i className="pi pi-undo" aria-hidden="true" />
                  {closing ? 'Devolviendo…' : 'Registrar devolución'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailOverlay>

      <AsignacionFormOverlay
        open={crud.isCreate}
        prefill={crud.record}
        activos={lookups.activos}
        ubicaciones={lookups.ubicaciones}
        responsables={lookups.responsables}
        asignaciones={asignacionesAll.data}
        tipos={tipos.data}
        onClose={crud.close}
        onSave={async (values) => {
          await asignacionService.entregar({
            idActivo: Number(values.idActivo),
            idUsuario: usuario?.id,
            idResponsable: Number(values.idResponsable),
            fecha: values.fecha,
            observaciones: values.observaciones,
          });
          setBanner({ message: 'Entrega registrada.', variant: 'empty' });
          crud.close();
          await reload();
          await activos.reload();
          await asignacionesAll.reload();
        }}
      />
    </section>
  );
}
