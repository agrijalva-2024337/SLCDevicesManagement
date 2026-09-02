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
        description="Andamiaje del frontend listo. Esta pantalla verifica el layout, el sistema de diseño y el cliente HTTP. Las pantallas de negocio se construyen en sprints posteriores."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="VITE_API_URL" value={env.apiUrl || '(no definida)'} hint="Base URL del backend .NET" />
        <StatCard label="VITE_USE_API_MOCK" value={String(env.useApiMock)} hint="Catálogos en memoria si es true" />
      </div>

      <div className="app-panel mt-6">
        <h3 className="text-sm font-semibold text-navy">Estado del cliente HTTP</h3>
        <p className="mt-1 text-sm text-text-muted">
          {env.useApiMock
            ? 'Modo mock: no se llama a la API real.'
            : 'Modo API: GET /weatherforecast (endpoint de plantilla del backend).'}
        </p>

        <div className="mt-4">
          <FeedbackState
            status={status}
            loadingMessage="Comprobando el cliente HTTP..."
            errorMessage={getErrorMessage(error)}
          >
            {data ? (
              <div className="rounded-md bg-success-soft px-4 py-3 text-sm text-accent-text">
                <p className="font-medium">{data.message}</p>
                <p className="mt-1 text-text-secondary">Origen: {data.source}</p>
              </div>
            ) : null}
          </FeedbackState>
        </div>
      </div>
    </section>
  );
}
