import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TIPO_DIFERENCIA_LABEL, TIPO_DIFERENCIA_TONE } from '@/features/inventario/tipoDiferencia';
import * as historicoInventarioService from '@/features/inventario/historicoInventarioService';
import { activosVistaPath } from '@/features/activos/activosVistas';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { DualBars, HBarChart, Sparkline, WaveSpark } from '@/features/reportes/components/ActivityCharts';
import { CATEGORY_ICON, RANGE_OPTIONS } from '@/features/reportes/dashboardParams';
import * as reporteService from '@/features/reportes/reporteService';
import { ESTADO_ACTIVO } from '@/shared/api/tipoAsignacion';
import '@/features/reportes/dashboard.css';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { ToneBadge } from '@/shared/components/StatusBadge';
import { listQueryKey, reportQueryKey } from '@/shared/data/queryKeys';
import { useResource } from '@/shared/hooks/useResource';
import { formatDate } from '@/shared/utils/format';

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
  return (rows ?? []).reduce(
    (acc, row) => ({
      totalActivos: acc.totalActivos + Number(row.totalActivos ?? 0),
      disponibles: acc.disponibles + Number(row.disponibles ?? 0),
      asignados: acc.asignados + Number(row.asignados ?? 0),
      enMantenimiento: acc.enMantenimiento + Number(row.enMantenimiento ?? 0),
      dadosDeBaja: acc.dadosDeBaja + Number(row.dadosDeBaja ?? 0),
      costoAdquisicionTotal: acc.costoAdquisicionTotal + Number(row.costoAdquisicionTotal ?? 0),
    }),
    vacio(),
  );
}

function percentOf(part, total) {
  if (!total) return 0;
  return Math.round((Number(part) / Number(total)) * 100);
}

const CATEGORY_TONE = ['info', 'success', 'warning', 'danger', 'primary'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { idActiva } = useEmpresaActiva();
  const [range, setRange] = useState('30');
  const diasGarantia = Number(range);

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
  const loadGarantias = useCallback(
    () => reporteService.garantiasPorVencer({ idEmpresa: idActiva || undefined, dias: diasGarantia }),
    [diasGarantia, idActiva],
  );
  const loadDiferencias = useCallback(
    () => reporteService.diferenciasInventario({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const loadJornadas = useCallback(
    () => historicoInventarioService.listar({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );

  const empresaParams = idActiva || undefined;
  const inventario = useResource(loadInventario, {
    key: reportQueryKey('inventarioGeneral', { idEmpresa: empresaParams }),
  });
  const categorias = useResource(loadCategorias, {
    key: reportQueryKey('activosPorCategoria', { idEmpresa: empresaParams }),
  });
  const sedes = useResource(loadSedes, {
    key: reportQueryKey('activosPorSede', { idEmpresa: empresaParams }),
  });
  const garantias = useResource(loadGarantias, {
    key: reportQueryKey('garantiasPorVencer', { idEmpresa: empresaParams, dias: diasGarantia }),
  });
  const diferencias = useResource(loadDiferencias, {
    key: reportQueryKey('diferenciasInventario', { idEmpresa: empresaParams }),
  });
  const jornadas = useResource(loadJornadas, {
    key: listQueryKey('historicosInventario', { idEmpresa: empresaParams }),
  });

  const resumen = useMemo(() => consolidar(inventario.data), [inventario.data]);
  const spark = [
    resumen.disponibles,
    resumen.asignados,
    resumen.enMantenimiento,
    resumen.dadosDeBaja,
    resumen.totalActivos,
  ];
  const jornadasAbiertas = (jornadas.data ?? []).filter((row) => !row.cerrado).length;
  const jornadasCerradas = (jornadas.data ?? []).filter((row) => row.cerrado).length;
  const totalEstados = resumen.disponibles + resumen.asignados + resumen.enMantenimiento + resumen.dadosDeBaja;

  const widgets = [
    {
      key: 'activos',
      label: 'Activos',
      value: resumen.totalActivos,
      icon: 'pi-box',
      tone: 'primary',
      to: '/app/activos',
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
      key: 'resg',
      label: 'Resguardo',
      value: resumen.disponibles,
      icon: 'pi-inbox',
      tone: 'warning',
      to: `/app/activos?estado=${encodeURIComponent(ESTADO_ACTIVO.Disponible)}`,
    },
    {
      key: 'mant',
      label: 'Mantenimientos',
      value: resumen.enMantenimiento,
      icon: 'pi-wrench',
      tone: 'danger',
      to: activosVistaPath('mantenimientos', { abiertos: '1' }),
    },
  ];

  const brands = [
    {
      key: 'activos',
      title: 'Activos',
      icon: 'pi-box',
      tone: 'primary',
      to: '/app/activos',
      stats: [
        { label: 'Total', value: resumen.totalActivos },
        { label: 'Asignados', value: resumen.asignados },
      ],
    },
    {
      key: 'inventario',
      title: 'Inventario físico',
      icon: 'pi-list',
      tone: 'info',
      to: '/app/inventario-fisico',
      stats: [
        { label: 'Conteos abiertos', value: jornadasAbiertas },
        { label: 'Conteos cerrados', value: jornadasCerradas },
      ],
    },
    {
      key: 'mant',
      title: 'Mantenimientos',
      icon: 'pi-wrench',
      tone: 'accent',
      to: activosVistaPath('mantenimientos', { abiertos: '1' }),
      stats: [
        { label: 'Abiertos', value: resumen.enMantenimiento },
        { label: 'Dados de baja', value: resumen.dadosDeBaja },
      ],
    },
    {
      key: 'bajas',
      title: 'Bajas',
      icon: 'pi-calendar',
      tone: 'warning',
      to: activosVistaPath('bajas'),
      stats: [
        { label: 'Registradas', value: resumen.dadosDeBaja },
        { label: 'En mantenimiento', value: resumen.enMantenimiento },
      ],
    },
  ];

  const estadoItems = [
    { key: 'resg', label: 'En resguardo', value: resumen.disponibles, icon: 'pi-inbox', tone: 'warning' },
    { key: 'asig', label: 'Asignado', value: resumen.asignados, icon: 'pi-user', tone: 'info' },
    { key: 'mant', label: 'En mantenimiento', value: resumen.enMantenimiento, icon: 'pi-wrench', tone: 'danger' },
  ];

  const atencion = [
    ...(garantias.data ?? []).map((row) => {
      const dias = Number(row.diasRestantes);
      return {
        id: `g-${row.activo?.id ?? row.fechaVencimientoGarantia}`,
        severity: dias <= 7 ? 'alta' : dias <= 30 ? 'media' : 'baja',
        label: row.activo?.nombre ?? 'Activo',
        detail: `Garantía vence ${formatDate(row.fechaVencimientoGarantia)} · ${dias} días`,
        to: '/app/activos',
      };
    }),
    ...(diferencias.data ?? []).slice(0, 6).map((row) => ({
      id: `d-${row.idHistoricoInventario}-${row.idActivo}-${row.tipoDiferencia}`,
      severity: 'alta',
      label: `${row.nombreActivo ?? 'Activo'}`,
      detail: `${TIPO_DIFERENCIA_LABEL[row.tipoDiferencia] ?? row.tipoDiferencia} · ${row.nombreSede ?? ''}`,
      to: `/app/inventario-fisico/${row.idHistoricoInventario}`,
    })),
  ].slice(0, 8);

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
          <p className="dash-lead">Resumen general del sistema</p>
        </div>
        <label className="dash-period">
          <i className="pi pi-calendar" aria-hidden />
          <select aria-label="Periodo" value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.long}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="dash-widgets">
        {widgets.map((widget) => (
          <Link key={widget.key} to={widget.to} className={`dash-widget dash-widget--${widget.tone}`}>
            <i className={`pi ${widget.icon} dash-widget-icon`} aria-hidden />
            <p className="dash-widget-value tabular-nums">{widget.value}</p>
            <p className="dash-widget-title">{widget.label}</p>
            <Sparkline values={spark} fill />
          </Link>
        ))}
      </div>

      <div className="dash-brands">
        {brands.map((brand) => (
          <Link key={brand.key} to={brand.to} className={`dash-brand dash-brand--${brand.tone}`}>
            <div className="dash-brand-cap">
              <i className={`pi ${brand.icon}`} aria-hidden />
              <span className="dash-brand-title">{brand.title}</span>
              <WaveSpark values={spark} />
            </div>
            <div className="dash-brand-body">
              {brand.stats.map((stat) => (
                <span key={stat.label} className="dash-brand-stat">
                  <strong className="tabular-nums">{stat.value}</strong>
                  <span>{stat.label}</span>
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <section className="dash-card">
        <header className="dash-card-head is-split">
          <h2>Parque y movimientos</h2>
          <div className="dash-range" role="group" aria-label="Periodo">
            {RANGE_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={range === item.value ? 'is-on' : undefined}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <div className="dash-card-body">
          <div className="dash-minis">
            <div className="dash-mini-stat is-info">
              <span className="dash-mini-icon">
                <i className="pi pi-user" aria-hidden />
              </span>
              <div>
                <p className="dash-mini-label">Asignados</p>
                <p className="dash-mini-value tabular-nums">{resumen.asignados}</p>
                <p className="dash-mini-pct is-flat">{percentOf(resumen.asignados, resumen.totalActivos)}%</p>
              </div>
            </div>
            <div className="dash-mini-stat is-success">
              <span className="dash-mini-icon">
                <i className="pi pi-inbox" aria-hidden />
              </span>
              <div>
                <p className="dash-mini-label">En resguardo</p>
                <p className="dash-mini-value tabular-nums">{resumen.disponibles}</p>
                <p className="dash-mini-pct is-flat">{percentOf(resumen.disponibles, resumen.totalActivos)}%</p>
              </div>
            </div>
            <div className="dash-mini-stat is-warning">
              <span className="dash-mini-icon">
                <i className="pi pi-list-check" aria-hidden />
              </span>
              <div>
                <p className="dash-mini-label">Jornadas</p>
                <p className="dash-mini-value tabular-nums">{(jornadas.data ?? []).length}</p>
                <p className="dash-mini-pct is-flat">{jornadasAbiertas} abiertas</p>
              </div>
            </div>
            <div className="dash-mini-stat is-danger">
              <span className="dash-mini-icon">
                <i className="pi pi-bell" aria-hidden />
              </span>
              <div>
                <p className="dash-mini-label">Requieren atención</p>
                <p className="dash-mini-value tabular-nums">{atencion.length}</p>
                <p className="dash-mini-pct is-flat">garantías y diferencias</p>
              </div>
            </div>
          </div>

          <div className="dash-quad">
            <section className="dash-chart">
              <h3>Disponibles y asignados por sede</h3>
              {(sedes.data ?? []).length ? (
                <DualBars
                  items={(sedes.data ?? []).map((row) => ({
                    key: String(row.idSede),
                    label: row.nombreSede,
                    value1: Number(row.disponibles ?? 0),
                    value2: Number(row.asignados ?? 0),
                  }))}
                  label1="Disponibles"
                  label2="Asignados"
                />
              ) : (
                <p className="dash-empty">Sin sedes en el inventario.</p>
              )}
            </section>

            <section className="dash-chart">
              <h3>Por categoría</h3>
              {categorias.errorMessage ? (
                <p className="dash-empty">{categorias.errorMessage}</p>
              ) : (
                <HBarChart
                  items={(categorias.data ?? []).map((row, index) => ({
                    key: String(row.idCategoriaActivo),
                    label: row.nombreCategoria,
                    value: row.totalActivos,
                    icon: CATEGORY_ICON[row.nombreCategoria],
                    tone: CATEGORY_TONE[index % CATEGORY_TONE.length],
                  }))}
                  total={resumen.totalActivos || undefined}
                  onSelect={(item) =>
                    navigate(`/app/activos?idCategoriaActivo=${encodeURIComponent(item.key)}`)
                  }
                />
              )}
            </section>

            <section className="dash-chart">
              <h3>Estado del parque</h3>
              <HBarChart
                items={estadoItems}
                total={totalEstados || undefined}
                onSelect={(item) => {
                  if (item.key === 'mant') navigate(activosVistaPath('mantenimientos', { abiertos: '1' }));
                  else if (item.key === 'asig') {
                    navigate(`/app/activos?estado=${encodeURIComponent(ESTADO_ACTIVO.Asignado)}`);
                  } else {
                    navigate(`/app/activos?estado=${encodeURIComponent(ESTADO_ACTIVO.Disponible)}`);
                  }
                }}
              />
            </section>

            <section className="dash-chart">
              <h3>Por sede</h3>
              <HBarChart
                items={(sedes.data ?? []).map((row, index) => ({
                  key: String(row.idSede),
                  label: row.nombreSede,
                  value: row.totalActivos,
                  icon: 'pi-building',
                  tone: CATEGORY_TONE[index % CATEGORY_TONE.length],
                }))}
                total={resumen.totalActivos || undefined}
              />
            </section>
          </div>
        </div>
      </section>

      <div className="dash-bottom">
        <section className="dash-card">
          <header className="dash-card-head">
            <h2>
              <i className="pi pi-bell" aria-hidden />
              Requiere atención
            </h2>
          </header>
          <div className="dash-card-body">
            {atencion.length === 0 ? (
              <p className="dash-empty">Nada pendiente ahora.</p>
            ) : (
              <ul className="dash-attention">
                {atencion.map((item) => (
                  <li key={item.id}>
                    <Link to={item.to}>
                      <span className={`dash-sev is-${item.severity}`}>
                        {item.severity === 'alta' ? 'Alta' : item.severity === 'media' ? 'Media' : 'Baja'}
                      </span>
                      <span className="dash-attention-copy">
                        <span className="dash-attention-title">{item.label}</span>
                        <span className="dash-attention-detail">{item.detail}</span>
                      </span>
                      <i className="pi pi-chevron-right" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="dash-card dash-table-card">
          <header className="dash-card-head is-split">
            <h2>
              <i className="pi pi-clock" aria-hidden />
              Diferencias cerradas
            </h2>
            <Link to="/app/inventario-fisico" className="dash-inline-link">
              Ver inventario
              <i className="pi pi-arrow-right" aria-hidden />
            </Link>
          </header>
          {(diferencias.data ?? []).length === 0 ? (
            <div className="dash-card-body">
              <p className="dash-empty">No hay diferencias en jornadas cerradas.</p>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Registro</th>
                    <th>Tipo</th>
                    <th>Sede</th>
                    <th>Cuándo</th>
                  </tr>
                </thead>
                <tbody>
                  {(diferencias.data ?? []).slice(0, 8).map((row) => (
                    <tr
                      key={`${row.idHistoricoInventario}-${row.idActivo}-${row.tipoDiferencia}`}
                      onClick={() => navigate(`/app/inventario-fisico/${row.idHistoricoInventario}`)}
                    >
                      <td>
                        <span className="dash-table-name">{row.nombreActivo ?? '—'}</span>
                      </td>
                      <td>
                        <ToneBadge tone={TIPO_DIFERENCIA_TONE[row.tipoDiferencia] ?? 'muted'}>
                          {TIPO_DIFERENCIA_LABEL[row.tipoDiferencia] ?? row.tipoDiferencia}
                        </ToneBadge>
                      </td>
                      <td>
                        <span className="dash-table-chip">{row.nombreSede ?? '—'}</span>
                      </td>
                      <td>{formatDate(row.fechaInicio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
