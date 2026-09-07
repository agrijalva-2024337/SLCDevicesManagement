import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { listarAgrupadosPorUbicacion } from '@/features/inventario/activosEsperados';
import * as detalleActivoService from '@/features/inventario/detalleActivoService';
import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailField, DetailOverlay } from '@/shared/components/DetailOverlay';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useCrudOverlay } from '@/shared/hooks/useCrudOverlay';
import { useRecordDeepLink } from '@/shared/hooks/useRecordDeepLink';
import { useResource } from '@/shared/hooks/useResource';
import { byId, formatDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

function resultadoDe(hallazgo) {
  if (!hallazgo) return { label: 'Pendiente', tone: 'muted' };
  if (!hallazgo.encontrado) return { label: 'No encontrado', tone: 'danger' };
  if (!hallazgo.buenEstado) return { label: 'Mal estado', tone: 'warning' };
  return { label: 'Encontrado', tone: 'success' };
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
  const sedes = useResource(sedeService.getAll);
  const crud = useCrudOverlay();
  const [jornada, setJornada] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
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
    reload();
  }, [reload]);

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
          <StatusBadge
            active={!jornada?.cerrado}
            activeLabel="Abierta"
            inactiveLabel="Cerrada"
            tone={jornada?.cerrado ? 'default' : 'warning'}
          />
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Esperados" value={esperados} hint="Activos de la sede, sin bajas" />
        <StatCard label="Verificados" value={verificados} featured hint="Con hallazgo en esta jornada" />
        <StatCard label="Pendientes" value={pendientes} hint="Aún sin registrar" />
      </div>

      <p className="mb-4 text-sm text-text-muted">
        Inicio {formatDate(jornada?.fechaInicio)}
        {jornada?.responsable ? ` · ${jornada.responsable}` : ''}
        {jornada?.cerrado ? ` · Cierre ${formatDate(jornada.fechaCierre)}` : ''}
      </p>

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
                getRowActions={(row) =>
                  row.verificado
                    ? { view: { onClick: () => crud.openView(row.hallazgo) } }
                    : {}
                }
              />
            </div>
          );
        })
      )}

      <DetailOverlay
        open={crud.isView}
        title={crud.record ? `Activo #${crud.record.idActivo}` : 'Hallazgo'}
        kicker="Verificación"
        onClose={crud.close}
      >
        {crud.record ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Encontrado" value={crud.record.encontrado ? 'Sí' : 'No'} />
            <DetailField label="Buen estado" value={crud.record.buenEstado ? 'Sí' : 'No'} />
            <DetailField label="Fecha" value={formatDate(crud.record.fechaVerificacion)} />
            <div className="sm:col-span-2">
              <DetailField label="Observaciones" value={crud.record.observaciones} />
            </div>
          </div>
        ) : null}
      </DetailOverlay>
    </section>
  );
}
