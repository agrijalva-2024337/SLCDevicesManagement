import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Tag } from 'primereact/tag';
import { FeedbackState } from '@/shared/components/FeedbackState';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { env } from '@/shared/config/env';
import { useApiHealth } from '@/shared/hooks/useApiHealth';
import { catalogos } from '@/shared/layout/navigation';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

const catalogPreview = catalogos.map((item, index) => ({
  id: item.slug,
  nombre: item.label,
  estado: index % 3 === 0 ? 'Inactivo' : 'Activo',
}));

export function DashboardPage() {
  const { status, data, error } = useApiHealth();

  return (
    <section className="space-y-8">
      <PageHeader
        title="Panel de control"
        description="Vista de trabajo del inventario multiempresa. Los indicadores de negocio se conectarán a reportes en el Sprint 9."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Activos registrados" value="1,284" hint="Dato de prueba" />
        <StatCard label="Empresas administradas" value="9" hint="Dato de prueba" />
        <StatCard label="Sedes activas" value="11" hint="Dato de prueba" />
        <StatCard label="Conteos cerrados" value="24" hint="Dato de prueba" />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-card p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            VITE_API_URL
          </dt>
          <dd className="mt-1 break-all font-mono text-sm text-navy">
            {env.apiUrl || '(no definida)'}
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-surface-card p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            VITE_USE_API_MOCK
          </dt>
          <dd className="mt-1 font-mono text-sm text-navy">{String(env.useApiMock)}</dd>
        </div>
      </dl>

      <div className="rounded-lg border border-border bg-surface-card p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold text-navy">Estado del cliente HTTP</h2>
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
                <p className="mt-1">Origen: {data.source}</p>
              </div>
            ) : null}
          </FeedbackState>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface-card shadow-sm">
        <DataTable value={catalogPreview} size="small" stripedRows>
          <Column field="nombre" header="Catálogo" />
          <Column
            field="estado"
            header="Estado"
            body={(row) => (
              <Tag
                value={row.estado}
                severity={row.estado === 'Activo' ? 'success' : 'secondary'}
              />
            )}
          />
        </DataTable>
      </div>
    </section>
  );
}
