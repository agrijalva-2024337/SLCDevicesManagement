import { useCallback, useMemo } from 'react';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
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

export function DashboardPage() {
  const { idActiva } = useEmpresaActiva();
  const loadInventario = useCallback(
    () => reporteService.inventarioGeneral({ idEmpresa: idActiva || undefined }),
    [idActiva],
  );
  const inventario = useResource(loadInventario);
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
