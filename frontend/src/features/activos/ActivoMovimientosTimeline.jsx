import { formatDateTime } from '@/shared/utils/format';

export function ActivoMovimientosTimeline({ movimientos, loading }) {
  if (loading) {
    return (
      <div className="app-feedback app-feedback--loading" role="status">
        Cargando movimientos…
      </div>
    );
  }

  if (!movimientos?.length) {
    return <p className="text-sm text-text-muted">Este activo aún no tiene movimientos registrados.</p>;
  }

  return (
    <ol className="space-y-4">
      {movimientos.map((item) => (
        <li key={item.id} className="app-feed-item">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {formatDateTime(item.fechaHora)}
          </p>
          <p className="mt-1 font-semibold text-navy">{item.descripcion || item.tipoOperacion || 'Movimiento'}</p>
          {item.informacionAnterior ? (
            <p className="mt-1 text-sm text-text-muted">Antes: {item.informacionAnterior}</p>
          ) : null}
          {item.informacionNueva ? (
            <p className="mt-0.5 text-sm text-text-secondary">Después: {item.informacionNueva}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
