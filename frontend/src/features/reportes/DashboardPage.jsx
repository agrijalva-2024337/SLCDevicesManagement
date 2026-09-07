import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { HBarChart } from '@/features/reportes/components/ActivityCharts';
import * as reporteService from '@/features/reportes/reporteService';
import '@/features/reportes/dashboard.css';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { useResource } from '@/shared/hooks/useResource';
import { formatMoney } from '@/shared/utils/format';

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

const CATEGORY_ICON = {
  Laptop: 'pi-desktop',
  Monitor: 'pi-image',
  Impresora: 'pi-print',
  'Switch de red': 'pi-wifi',
  Servidor: 'pi-server',
  Vehículo: 'pi-car',
  Tablet: 'pi-tablet',
};

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
  const ubicacionesFiltradas = useMemo(() => {
    if (idSedeSel == null) return ubicaciones.data ?? [];
    return (ubicaciones.data ?? []).filter((row) => Number(row.idSede) === Number(idSedeSel));
  }, [idSedeSel, ubicaciones.data]);
  const resumen = useMemo(() => consolidar(inventario.data), [inventario.data]);
  const variasEmpresas = (inventario.data?.length ?? 0) > 1;

  const widgets = [
    { key: 'total', label: 'Activos', value: resumen.totalActivos, icon: 'pi-box', tone: 'primary' },
    { key: 'disp', label: 'Disponibles', value: resumen.disponibles, icon: 'pi-check-circle', tone: 'success' },
    { key: 'asig', label: 'Asignados', value: resumen.asignados, icon: 'pi-users', tone: 'info' },
    { key: 'mant', label: 'En mantenimiento', value: resumen.enMantenimiento, icon: 'pi-wrench', tone: 'warning' },
    { key: 'baja', label: 'Dados de baja', value: resumen.dadosDeBaja, icon: 'pi-times-circle', tone: 'danger' },
    {
      key: 'costo',
      label: 'Costo de adquisición',
      value: formatMoney(resumen.costoAdquisicionTotal, 'GTQ'),
      icon: 'pi-wallet',
      tone: 'primary',
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
          <article key={widget.key} className={`dash-widget dash-widget--${widget.tone}`}>
            <i className={`pi ${widget.icon} dash-widget-icon`} aria-hidden />
            <p className="dash-widget-value tabular-nums">{widget.value}</p>
            <p className="dash-widget-title">{widget.label}</p>
          </article>
        ))}
      </div>

      <section className="dash-card">
        <header className="dash-card-head">
          <div>
            <h2>Activos por categoría</h2>
            <p className="dash-hint">Cada barra abre el reporte detallado de esa categoría.</p>
          </div>
        </header>
        <div className="dash-card-body">
          {categorias.errorMessage ? (
            <p className="dash-empty">{categorias.errorMessage}</p>
          ) : categorias.data.length === 0 ? (
            <p className="dash-empty">No hay activos por categoría.</p>
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
        </div>
      </section>

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
                        className={Number(idSedeSel) === Number(row.idSede) ? 'is-on' : undefined}
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
                {idSedeSel == null ? 'Todas las sedes de la empresa activa.' : 'Filtrado en cliente, sin otra petición.'}
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
