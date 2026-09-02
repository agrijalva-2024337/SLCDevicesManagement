import { useMemo } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { nameById } from '@/features/catalogos/maestros';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { OverlayOutlet } from '@/shared/components/OverlayOutlet';
import { RegisterButton } from '@/shared/components/RecordActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';

export { SedeDetallePage } from '@/features/organizacion/sedes/SedeDetallePage';
export { SedeFormPage } from '@/features/organizacion/sedes/SedeFormPage';

function CatalogBanner({ banner }) {
  if (!banner) {
    return null;
  }

  const tone = banner.variant === 'error' ? 'app-feedback--error' : 'app-feedback--empty';

  return (
    <div className={`app-feedback ${tone}`} role={banner.variant === 'error' ? 'alert' : 'status'}>
      {banner.message}
    </div>
  );
}

export function SedesPage() {
  const { canWrite } = useAuth();
  const allowWrite = canWrite('sedes');
  const { rows, visibleRows, isLoading, errorMessage, banner, reload } =
    useCatalogCollection(sedeService.getAll);
  const empresas = useResource(empresaService.getAll);
  const empresaNombres = useMemo(() => nameById(empresas.data), [empresas.data]);
  const outletContext = useMemo(() => ({ reload, rows }), [reload, rows]);

  const columns = useMemo(
    () => [
      { key: 'nombre', header: 'Nombre', primary: true },
      {
        key: 'empresa',
        header: 'Empresa',
        getValue: (sede) => empresaNombres[sede.idEmpresa] ?? '—',
      },
      { key: 'direccion', header: 'Dirección' },
      { key: 'habilitado', header: 'Estado', type: 'status' },
    ],
    [empresaNombres],
  );

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  return (
    <section>
      <CatalogBanner banner={banner} />
      <DataTable
        title="Sedes"
        description="Instalaciones físicas de cada empresa."
        primaryAction={allowWrite ? <RegisterButton to="nueva" label="Registrar sede" /> : null}
        columns={columns}
        rows={visibleRows}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, empresa o dirección"
        statusFilter={{ key: 'habilitado' }}
        emptyTitle="No hay sedes"
        emptyDescription="Registre la primera sede para vincularla a una empresa."
        getRowActions={(sede) => ({
          view: { to: `${sede.id}` },
          edit: allowWrite ? { to: `${sede.id}/editar` } : undefined,
        })}
      />
      <OverlayOutlet context={outletContext} />
    </section>
  );
}
