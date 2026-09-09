import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { listarAgrupadosPorUbicacion } from '@/features/inventario/activosEsperados';
import * as detalleActivoService from '@/features/inventario/detalleActivoService';
import { DiferenciasPanel } from '@/features/inventario/DiferenciasPanel';
import { HallazgoFormOverlay } from '@/features/inventario/HallazgoFormOverlay';
import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import { todayIsoDate } from '@/features/inventario/trasladoRuta';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Tooltip } from '@/shared/components/Tooltip';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { saveSuccessResult } from '@/shared/components/SaveSuccessPanel';

function resultadoDe(hallazgo) {
  if (!hallazgo) return { label: 'Pendiente', tone: 'muted' };
  if (!hallazgo.encontrado) return { label: 'No encontrado', tone: 'danger' };
  if (!hallazgo.buenEstado) return { label: 'Mal estado', tone: 'warning' };
  return { label: 'Encontrado', tone: 'success' };
}

function motivoBloqueoEscritura(allowWrite, cerrado) {
  if (!allowWrite) return 'Su perfil es de consulta. No puede modificar el inventario físico.';
  if (cerrado) return 'La jornada ya está cerrada.';
  return null;
}

function flattenFilas(grupos, hallazgoPorActivo) {
  return grupos.flatMap((grupo) =>
    grupo.activos.map((activo) => {
      const hallazgo = hallazgoPorActivo.get(Number(activo.id)) ?? null;
      const resultado = resultadoDe(hallazgo);
      return {
        id: hallazgo?.id ?? `pendiente-${activo.id}`,
        idActivo: activo.id,
        activoNombre: activo.nombre,
        numeroSerie: activo.numeroSerie,
        ubicacionNombre: grupo.nombreUbicacion,
        hallazgo,
        resultado: resultado.label,
        resultadoTone: resultado.tone,
        verificado: Boolean(hallazgo),
      };
    }),
  );
}

export function JornadaDetallePage() {
  const { id } = useParams();
  const { canWrite } = useAuth();
  const allowWrite = canWrite('inventario-fisico');
  const sedes = useResource(sedeService.getAll);
  const crud = useCrudOverlay();
  const [jornada, setJornada] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [banner, setBanner] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [closeError, setCloseError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const next = await historicoInventarioService.getById(id);
      const [nextGrupos, nextHallazgos] = await Promise.all([
        listarAgrupadosPorUbicacion(next.idSede),
        detalleActivoService.listarPorJornada(next.id),
      ]);
      setJornada(next);
      setGrupos(nextGrupos);
      setHallazgos(nextHallazgos);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await historicoInventarioService.getById(id);
        if (cancelled) return;
        const [nextGrupos, nextHallazgos] = await Promise.all([
          listarAgrupadosPorUbicacion(next.idSede),
          detalleActivoService.listarPorJornada(next.id),
        ]);
        if (cancelled) return;
        setJornada(next);
        setGrupos(nextGrupos);
        setHallazgos(nextHallazgos);
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const hallazgoPorActivo = useMemo(() => {
    const map = new Map();
    for (const item of hallazgos) {
      map.set(Number(item.idActivo), item);
    }
    return map;
  }, [hallazgos]);

  const filas = useMemo(() => flattenFilas(grupos, hallazgoPorActivo), [grupos, hallazgoPorActivo]);
  const esperados = filas.length;
  const verificados = filas.filter((row) => row.verificado).length;
  const pendientes = esperados - verificados;
  const sede = byId(sedes.data, jornada?.idSede);
  const hallazgosConId = useMemo(() => hallazgos.filter((item) => item.id != null), [hallazgos]);
  const bloqueoEscritura = motivoBloqueoEscritura(allowWrite, Boolean(jornada?.cerrado));

  useRecordDeepLink(hallazgosConId, crud.openView);

  if (isLoading && !jornada) {
    return <FeedbackState status="loading" loadingMessage="Cargando la jornada…" />;
  }

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
        <Link to="/app/inventario-fisico" className="app-btn app-btn--ghost mt-4">
          Volver a jornadas
        </Link>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title={sede?.nombre ?? `Jornada #${jornada?.id}`}
        description={jornada?.observaciones || 'Hoja de conteo agrupada por ubicación.'}
        actions={
          <>
            <StatusBadge
              active={!jornada?.cerrado}
              activeLabel="Abierta"
              inactiveLabel="Cerrada"
              tone={jornada?.cerrado ? 'default' : 'warning'}
            />
            {bloqueoEscritura ? (
              <Tooltip label={bloqueoEscritura}>
                <button type="button" className="app-btn app-btn--primary" disabled>
                  <i className="pi pi-lock" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                className="app-btn app-btn--primary"
                onClick={() => {
                  setCloseError(null);
                  setPendingClose(true);
                }}
              >
                <i className="pi pi-lock" aria-hidden="true" />
                Cerrar jornada
              </button>
            )}
          </>
        }
      />

      <div className="app-fields app-fields--3 mb-6">
        <StatCard label="Esperados" value={esperados} hint="Activos de la sede, sin bajas" />
        <StatCard label="Verificados" value={verificados} featured hint="Con hallazgo en esta jornada" />
        <StatCard label="Pendientes" value={pendientes} hint="Aún sin registrar" />
      </div>

      <p className="mb-4 text-sm text-text-muted">
        Inicio {formatDate(jornada?.fechaInicio)}
        {jornada?.responsable ? ` · ${jornada.responsable}` : ''}
        {jornada?.cerrado ? ` · Cierre ${formatDate(jornada.fechaCierre)}` : ''}
      </p>

      {banner ? (
        <div
          className={`app-feedback mb-4 ${banner.variant === 'error' ? 'app-feedback--error' : 'app-feedback--empty'}`}
          role={banner.variant === 'error' ? 'alert' : 'status'}
        >
          {banner.message}
        </div>
      ) : null}

      {grupos.length === 0 ? (
        <div className="app-feedback app-feedback--empty" role="status">
          No hay activos esperados en las ubicaciones de esta sede.
        </div>
      ) : (
        grupos.map((grupo) => {
          const rows = filas.filter((row) => row.ubicacionNombre === grupo.nombreUbicacion);
          return (
            <div key={grupo.ubicacion.id} className="app-panel mb-4">
              <DataTable
                title={grupo.nombreUbicacion}
                description={`${rows.filter((row) => row.verificado).length} de ${rows.length} verificados`}
                columns={[
                  { key: 'activoNombre', header: 'Activo', primary: true },
                  { key: 'numeroSerie', header: 'Serie', mono: true },
                  {
                    key: 'resultado',
                    header: 'Resultado',
                    type: 'badge',
                    tone: (row) => row.resultadoTone,
                  },
                ]}
                rows={rows}
                hideToolbar
                emptyTitle="Sin activos"
                getRowActions={(row) => {
                  if (row.verificado) {
                    return {
                      view: { onClick: () => crud.openView(row.hallazgo) },
                      edit: {
                        enabled: !bloqueoEscritura,
                        disabledReason: bloqueoEscritura ?? undefined,
                        onClick: () =>
                          crud.openEdit({
                            ...row.hallazgo,
                            activoNombre: row.activoNombre,
                          }),
                      },
                      remove: {
                        enabled: !bloqueoEscritura,
                        disabledReason: bloqueoEscritura ?? undefined,
                        onClick: () => {
                          setDeleteError(null);
                          setPendingDelete({ ...row.hallazgo, activoNombre: row.activoNombre });
                        },
                      },
                    };
                  }
                  return {
                    create: {
                      enabled: !bloqueoEscritura,
                      disabledReason: bloqueoEscritura ?? undefined,
                      onClick: () =>
                        crud.openCreate({
                          idActivo: row.idActivo,
                          activoNombre: row.activoNombre,
                          idHistoricoInventario: jornada.id,
                        }),
                    },
                  };
                }}
              />
            </div>
          );
        })
      )}

      <DiferenciasPanel
        jornadaId={jornada?.id}
        cerrado={Boolean(jornada?.cerrado)}
        refreshKey={`${hallazgos.length}-${verificados}-${jornada?.cerrado}`}
      />

      <DetailOverlay
        open={crud.isView}
        title={crud.record ? `Activo #${crud.record.idActivo}` : 'Hallazgo'}
        kicker="Verificación"
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="app-fields">
            <DetailField label="Encontrado" value={crud.record.encontrado ? 'Sí' : 'No'} />
            <DetailField label="Buen estado" value={crud.record.buenEstado ? 'Sí' : 'No'} />
            <DetailField label="Fecha" value={formatDate(crud.record.fechaVerificacion)} />
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={crud.record.observaciones} />
            </div>
          </div>
        ) : null}
      </DetailOverlay>

      <HallazgoFormOverlay
        open={crud.isCreate || crud.isEdit}
        prefill={crud.record}
        onClose={crud.close}
        onSave={async (values) => {
          if (crud.isEdit) {
            await detalleActivoService.actualizar(crud.record.id, {
              encontrado: values.encontrado,
              buenEstado: values.buenEstado,
              observaciones: values.observaciones,
            });
            await reload();
            return saveSuccessResult({ created: false, entityLabel: 'hallazgo' });
          }
          await detalleActivoService.registrar({
            idActivo: Number(values.idActivo || crud.record?.idActivo),
            idHistoricoInventario: Number(jornada.id),
            encontrado: values.encontrado,
            buenEstado: values.buenEstado,
            observaciones: values.observaciones,
            fechaVerificacion: values.fechaVerificacion,
          });
          await reload();
          return saveSuccessResult({ created: true, entityLabel: 'hallazgo' });
        }}
      />

      <DetailOverlay
        open={Boolean(pendingDelete)}
        title="Eliminar hallazgo"
        kicker="Confirmación"
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      >
        <p className="text-base text-navy">
          Se eliminará la verificación de {pendingDelete?.activoNombre ?? 'este activo'}. El movimiento de
          verificación asociado en el historial del activo también se borra en el servidor.
        </p>
        {deleteError ? (
          <div className="app-feedback app-feedback--error" role="alert">
            {deleteError}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="app-btn app-btn--primary"
            onClick={async () => {
              try {
                await detalleActivoService.eliminar(pendingDelete.id);
                setBanner({ message: 'Hallazgo eliminado.', variant: 'empty' });
                setPendingDelete(null);
                setDeleteError(null);
                crud.close();
                await reload();
              } catch (error) {
                setDeleteError(getErrorMessage(error));
              }
            }}
          >
            <i className="pi pi-trash" aria-hidden="true" />
            Eliminar
          </button>
          <button
            type="button"
            className="app-btn app-btn--ghost"
            onClick={() => {
              setPendingDelete(null);
              setDeleteError(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </DetailOverlay>

      <DetailOverlay
        open={pendingClose}
        title="Cerrar jornada"
        kicker="Confirmación"
        onClose={() => {
          setPendingClose(false);
          setCloseError(null);
        }}
      >
        <p className="text-base text-navy">
          {pendientes > 0
            ? `Hay ${pendientes} activo${pendientes === 1 ? '' : 's'} pendiente${pendientes === 1 ? '' : 's'} de verificar. `
            : 'Todos los activos esperados ya tienen hallazgo. '}
          Al cerrar no se podrán registrar, editar ni eliminar hallazgos. Esta acción no se puede deshacer.
        </p>
        {closeError ? (
          <div className="app-feedback app-feedback--error" role="alert">
            {closeError}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="app-btn app-btn--primary"
            onClick={async () => {
              try {
                await historicoInventarioService.cerrar(jornada.id, todayIsoDate());
                setBanner({ message: 'Jornada cerrada.', variant: 'empty' });
                setPendingClose(false);
                setCloseError(null);
                crud.close();
                setPendingDelete(null);
                await reload();
              } catch (error) {
                const message = getErrorMessage(error);
                setCloseError(message);
                setBanner({ message, variant: 'error' });
              }
            }}
          >
            <i className="pi pi-lock" aria-hidden="true" />
            Cerrar jornada
          </button>
          <button
            type="button"
            className="app-btn app-btn--ghost"
            onClick={() => {
              setPendingClose(false);
              setCloseError(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </DetailOverlay>
    </section>
  );
}
