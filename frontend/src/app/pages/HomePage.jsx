import { FeedbackState } from '@/shared/components/FeedbackState';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { env } from '@/shared/config/env';
import { useApiHealth } from '@/shared/hooks/useApiHealth';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

export function HomePage() {
  const { status, data, error } = useApiHealth();

  return (
    <section>
      <PageHeader
        title="SLCDevicesManagement"
        description="Inicio de la consola de inventario."
      />

      <div className="app-fields">
        <StatCard label="Entorno" value={env.useApiMock ? 'Demostración' : 'En línea'} hint="Modo de operación actual" />
      </div>

      <div className="app-panel mt-6">
        <h3 className="text-sm font-semibold text-navy">Estado del servicio</h3>
        <p className="mt-1 text-sm text-text-muted">
          {env.useApiMock
            ? 'Modo demostración: los datos se simulan en el navegador.'
            : 'Comprobando la conexión con el servicio.'}
        </p>

        <div className="mt-4">
          <FeedbackState
            status={status}
            loadingMessage="Comprobando la conexión..."
            errorMessage={getErrorMessage(error)}
          >
            {data ? (
              <div className="rounded-md bg-success-soft px-4 py-3 text-sm text-accent-text">
                <p className="font-medium">{data.ok ? 'Servicio disponible.' : 'Servicio no disponible.'}</p>
              </div>
            ) : null}
          </FeedbackState>
        </div>
      </div>
    </section>
  );
}
