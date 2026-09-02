import { useMemo } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import { filterRowsByEmpresa, useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { DataTable } from '@/shared/components/DataTable';
import { OverlayOutlet } from '@/shared/components/OverlayOutlet';
import { RegisterButton } from '@/shared/components/RecordActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';

export { EmpresaDetallePage } from '@/features/organizacion/empresas/EmpresaDetallePage';
export { EmpresaFormPage } from '@/features/organizacion/empresas/EmpresaFormPage';

const columns = [
  { key: 'nombre', header: 'Nombre', primary: true },
  { key: 'nitCodigo', header: 'NIT', numeric: true },
  { key: 'direccion', header: 'Dirección' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'habilitado', header: 'Estado', type: 'status' },
];

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

export function EmpresasPage() {
  const { canWrite } = useAuth();
  const { idActiva } = useEmpresaActiva();
  const allowCreate = canWrite('empresas-create');
  const allowEdit = canWrite('empresas');
  const { rows, visibleRows, isLoading, errorMessage, banner, reload } =
    useCatalogCollection(empresaService.getAll);
  const scopedRows = useMemo(
    () => filterRowsByEmpresa(visibleRows, idActiva, { idField: 'id' }),
    [visibleRows, idActiva],
  );
  const outletContext = useMemo(() => ({ reload, rows }), [reload, rows]);

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
        title="Empresas"
        description="Registro corporativo."
        primaryAction={allowCreate ? <RegisterButton to="nueva" label="Registrar empresa" /> : null}
        columns={columns}
        rows={scopedRows}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, NIT, dirección o teléfono"
        statusFilter={{ key: 'habilitado' }}
        emptyTitle="No hay empresas"
        emptyDescription="Registre la primera empresa para comenzar."
        getRowActions={(empresa) => ({
          view: { to: `${empresa.id}` },
          edit: allowEdit ? { to: `${empresa.id}/editar` } : undefined,
        })}
      />
      <OverlayOutlet context={outletContext} />
    </section>
  );
}
