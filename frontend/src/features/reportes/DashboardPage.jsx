import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TIPO_DIFERENCIA_LABEL, TIPO_DIFERENCIA_TONE } from '@/features/inventario/tipoDiferencia';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { HBarChart } from '@/features/reportes/components/ActivityCharts';
import { DrillDownPanel } from '@/features/reportes/components/DrillDownPanel';
import { CATEGORY_ICON } from '@/features/reportes/dashboardParams';
import * as reporteService from '@/features/reportes/reporteService';
import { ESTADO_ACTIVO } from '@/shared/api/tipoAsignacion';
import '@/features/reportes/dashboard.css';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { useResource } from '@/shared/hooks/useResource';
import { formatDate, formatMoney } from '@/shared/utils/format';

function vacio() {
  return {
    totalActivos: 0,
    disponibles: 0,
    asignados: 0,
    enMantenimiento: 0,
    dadosDeBaja: 0,
    costoAdquisicionTotal: 0,
  };
}

function consolidar(rows) {
  return (rows ?? []).reduce((acc, row) => ({
    totalActivos: acc.totalActivos + Number(row.totalActivos ?? 0),
    disponibles: acc.disponibles + Number(row.disponibles ?? 0),
    asignados: acc.asignados + Number(row.asignados ?? 0),
    enMantenimiento: acc.enMantenimiento + Number(row.enMantenimiento ?? 0),
    dadosDeBaja: acc.dadosDeBaja + Number(row.dadosDeBaja ?? 0),
    costoAdquisicionTotal: acc.costoAdquisicionTotal + Number(row.costoAdquisicionTotal ?? 0),
  }), vacio());
}

const CATEGORY_TONE = ['info', 'success', 'warning', 'danger', 'primary'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { idActiva } = useEmpresaActiva();
  const loadInventario = useCallback(
    () => reporteService.inventarioGeneral({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const loadCategorias = useCallback(
    () => reporteService.activosPorCategoria({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const loadSedes = useCallback(
    () => reporteService.activosPorSede({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const loadUbicaciones = useCallback(
    () => reporteService.activosPorUbicacion({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const inventario = useResource(loadInventario);
  const categorias = useResource(loadCategorias);
  const sedes = useResource(loadSedes);
  const ubicaciones = useResource(loadUbicaciones);
  const [idSedeSel, setIdSedeSel] = useState(null);
  const [diasGarantia, setDiasGarantia] = useState(30);
  const sedeSigueVisible = (sedes.data ?? []).some((row) => Number(row.idSede) === Number(idSedeSel));
  const idSedeFiltro = sedeSigueVisible ? idSedeSel : null;
  const loadGarantias = useCallback(
    () => reporteService.garantiasPorVencer({ idEmpresa: idActiva || undefined, dias: diasGarantia }),
    [diasGarantia, idActiva],
  );
  const garantias = useResource(loadGarantias);
  const loadDiferencias = useCallback(
    () => reporteService.diferenciasInventario({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const diferencias = useResource(loadDiferencias);
  const diferenciasPorJornada = useMemo(() => {
    const groups = new Map();
    for (const row of diferencias.data ?? []) {
      const key = row.idHistoricoInventario;
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          nombreSede: row.nombreSede,
          fechaInicio: row.fechaInicio,
          filas: [],
        });
      }
      groups.get(key).filas.push(row);
    }
    return [...groups.values()];
  }, [diferencias.data]);
  const ubicacionesFiltradas = useMemo(() => {
    if (idSedeFiltro == null) return ubicaciones.data ?? [];
    return (ubicaciones.data ?? []).filter((row) => Number(row.idSede) === Number(idSedeFiltro));
  }, [idSedeFiltro, ubicaciones.data]);
  const resumen = useMemo(() => consolidar(inventario.data), [inventario.data]);
  const variasEmpresas = (inventario.data?.length ?? 0) > 1;

  const widgets = [
    { key: 'total', label: 'Activos', value: resumen.totalActivos, icon: 'pi-box', tone: 'primary', to: '/app/activos' },
    {
      key: 'disp',
      label: 'Disponibles',
      value: resumen.disponibles,
      icon: 'pi-check-circle',
      tone: 'success',
      to: `/app/activos?estado=${encodeURIComponent(ESTADO_ACTIVO.Disponible)}`,
    },
    {
      key: 'asig',
      label: 'Asignados',
      value: resumen.asignados,
      icon: 'pi-users',
      tone: 'info',
      to: `/app/activos?estado=${encodeURIComponent(ESTADO_ACTIVO.Asignado)}`,
    },
    {
      key: 'mant',
      label: 'En mantenimiento',
      value: resumen.enMantenimiento,
      icon: 'pi-wrench',
      tone: 'warning',
      to: '/app/mantenimientos?abiertos=1',
    },
    {
      key: 'baja',
      label: 'Dados de baja',
      value: resumen.dadosDeBaja,
      icon: 'pi-times-circle',
      tone: 'danger',
      to: '/app/bajas',
    },
    {
      key: 'costo',
      label: 'Costo de adquisición',
      value: formatMoney(resumen.costoAdquisicionTotal, 'GTQ'),
      icon: 'pi-wallet',
      tone: 'primary',
      to: '/app/reportes',
    },
  ];

  if (inventario.isLoading && !inventario.data?.length) {
    return <FeedbackState status="loading" loadingMessage="Cargando el inventario general…" />;
  }

  if (inventario.errorMessage) {
    return (
      <section className="dash-board">
        <div className="app-feedback app-feedback--error" role="alert">
          {inventario.errorMessage}
        </div>
      </section>
    );
  }

  return (
    <section className="dash-board">
      <header className="dash-head">
        <div>
          <h2 className="dash-title">Panel de control</h2>
          <p className="dash-lead">Inventario general por empresa activa.</p>
        </div>
      </header>

      <div className="dash-widgets">
        {widgets.map((widget) => (
          <Link key={widget.key} to={widget.to} className={`dash-widget dash-widget--${widget.tone}`}>
            <i className={`pi ${widget.icon} dash-widget-icon`} aria-hidden />
            <p className="dash-widget-value tabular-nums">{widget.value}</p>
            <p className="dash-widget-title">{widget.label}</p>
          </Link>
        ))}
      </div>

      <DrillDownPanel
        title="Activos por categoría"
        hint="Cada barra abre el reporte detallado de esa categoría."
        stack={[]}
        onChange={() => {}}
        empty={!categorias.errorMessage && categorias.data.length === 0}
        emptyMessage="No hay activos por categoría."
      >
        {categorias.errorMessage ? (
          <p className="dash-empty">{categorias.errorMessage}</p>
        ) : (
          <HBarChart
            items={categorias.data.map((row, index) => ({
              key: String(row.idCategoriaActivo),
              label: row.nombreCategoria,
              value: row.totalActivos,
              icon: CATEGORY_ICON[row.nombreCategoria],
              tone: CATEGORY_TONE[index % CATEGORY_TONE.length],
            }))}
            total={resumen.totalActivos || undefined}
            onSelect={(item) => navigate(`/app/reportes/activos?idCategoriaActivo=${item.key}`)}
          />
        )}
      </DrillDownPanel>

      <div className="dash-split">
        <section className="dash-table-card">
          <header className="dash-card-head">
            <div>
              <h2>Por sede</h2>
              <p className="dash-hint">Seleccione una sede para filtrar ubicaciones.</p>
            </div>
          </header>
          <div className="dash-card-body">
            {sedes.errorMessage ? (
              <p className="dash-empty">{sedes.errorMessage}</p>
            ) : (
              <div className="dash-mini-wrap">
                <table className="dash-mini">
                  <thead>
                    <tr>
                      <th>Sede</th>
                      <th>Activos</th>
                      <th>Disp.</th>
                      <th>Asig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sedes.data ?? []).map((row) => (
                      <tr
                        key={row.idSede}
                        className={Number(idSedeFiltro) === Number(row.idSede) ? 'is-on' : undefined}
                        onClick={() =>
                          setIdSedeSel((current) =>
                            Number(current) === Number(row.idSede) ? null : row.idSede,
                          )
                        }
                      >
                        <td>{row.nombreSede}</td>
                        <td className="tabular-nums">{row.totalActivos}</td>
                        <td className="tabular-nums">{row.disponibles}</td>
                        <td className="tabular-nums">{row.asignados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="dash-table-card">
          <header className="dash-card-head">
            <div>
              <h2>Por ubicación</h2>
              <p className="dash-hint">
                {idSedeFiltro == null
                  ? 'Todas las sedes de la empresa activa.'
                  : 'Filtrado en cliente, sin otra petición.'}
              </p>
            </div>
          </header>
          <div className="dash-card-body">
            {ubicaciones.errorMessage ? (
              <p className="dash-empty">{ubicaciones.errorMessage}</p>
            ) : ubicacionesFiltradas.length === 0 ? (
              <p className="dash-empty">No hay ubicaciones para el filtro.</p>
            ) : (
              <div className="dash-mini-wrap">
                <table className="dash-mini">
                  <thead>
                    <tr>
                      <th>Ubicación</th>
                      <th>Sede</th>
                      <th>Activos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ubicacionesFiltradas.map((row) => (
                      <tr key={row.idUbicacion}>
                        <td>{row.nombreUbicacion}</td>
                        <td>{row.nombreSede}</td>
                        <td className="tabular-nums">{row.totalActivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="dash-attention">
        <header className="dash-card-head is-split">
          <div>
            <h2>Garantías por vencer</h2>
            <p className="dash-hint">Ventana enviada al servidor como query `dias`.</p>
          </div>
          <div className="dash-range" role="group" aria-label="Ventana de garantías">
            {[30, 60, 90].map((dias) => (
              <button
                key={dias}
                type="button"
                className={diasGarantia === dias ? 'is-on' : undefined}
                onClick={() => setDiasGarantia(dias)}
              >
                {dias} días
              </button>
            ))}
          </div>
        </header>
        <div className="dash-card-body">
          {garantias.errorMessage ? (
            <p className="dash-empty">{garantias.errorMessage}</p>
          ) : garantias.data.length === 0 ? (
            <p className="dash-empty">Ninguna garantía vence en {diasGarantia} días.</p>
          ) : (
            <div className="dash-mini-wrap">
              <table className="dash-mini">
                <thead>
                  <tr>
                    <th>Activo</th>
                    <th>Sede</th>
                    <th>Vence</th>
                    <th>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {garantias.data.map((row) => {
                    const dias = Number(row.diasRestantes);
                    const tone = dias <= 7 ? 'danger' : dias <= 30 ? 'warning' : 'muted';
                    return (
                      <tr key={row.activo?.id ?? `${row.idSede}-${row.fechaVencimientoGarantia}`}>
                        <td>{row.activo?.nombre ?? '—'}</td>
                        <td>{row.nombreSede}</td>
                        <td>{formatDate(row.fechaVencimientoGarantia)}</td>
                        <td>
                          <ToneBadge tone={tone}>{dias}</ToneBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="dash-card">
        <header className="dash-card-head">
          <div>
            <h2>Diferencias de inventarios cerrados</h2>
            <p className="dash-hint">
              Este reporte solo incluye jornadas cerradas. El parcial de una jornada abierta está en su hoja
              de conteo.
            </p>
          </div>
        </header>
        <div className="dash-card-body">
          {diferencias.errorMessage ? (
            <p className="dash-empty">{diferencias.errorMessage}</p>
          ) : diferenciasPorJornada.length === 0 ? (
            <p className="dash-empty">No hay diferencias en jornadas cerradas.</p>
          ) : (
            diferenciasPorJornada.map((grupo) => (
              <div key={grupo.id} className="dash-mini-wrap">
                <h3 className="dash-subhead">
                  <Link to={`/app/inventario-fisico/${grupo.id}`}>
                    {grupo.nombreSede} · {formatDate(grupo.fechaInicio)}
                    <i className="pi pi-chevron-right" aria-hidden />
                  </Link>
                </h3>
                <table className="dash-mini">
                  <thead>
                    <tr>
                      <th>Activo</th>
                      <th>Tipo</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.filas.map((row) => (
                      <tr key={`${row.idHistoricoInventario}-${row.idActivo}-${row.tipoDiferencia}`}>
                        <td>{row.nombreActivo}</td>
                        <td>
                          <ToneBadge tone={TIPO_DIFERENCIA_TONE[row.tipoDiferencia] ?? 'muted'}>
                            {TIPO_DIFERENCIA_LABEL[row.tipoDiferencia] ?? row.tipoDiferencia}
                          </ToneBadge>
                        </td>
                        <td>{row.observaciones ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </section>

      {variasEmpresas ? (
        <section className="dash-card">
          <header className="dash-card-head">
            <div>
              <h2>Por empresa</h2>
              <p className="dash-hint">El consolidado de arriba suma estas filas.</p>
            </div>
          </header>
          <div className="dash-card-body">
            <div className="dash-mini-wrap">
              <table className="dash-mini">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Activos</th>
                    <th>Disponibles</th>
                    <th>Asignados</th>
                    <th>Mantenimiento</th>
                    <th>Baja</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.data.map((row) => (
                    <tr key={row.idEmpresa}>
                      <td>{row.nombreEmpresa}</td>
                      <td className="tabular-nums">{row.totalActivos}</td>
                      <td className="tabular-nums">{row.disponibles}</td>
                      <td className="tabular-nums">{row.asignados}</td>
                      <td className="tabular-nums">{row.enMantenimiento}</td>
                      <td className="tabular-nums">{row.dadosDeBaja}</td>
                      <td className="tabular-nums">{formatMoney(row.costoAdquisicionTotal, 'GTQ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
