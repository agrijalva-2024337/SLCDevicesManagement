import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { nameById } from '@/features/catalogos/maestros';
import * as paisService from '@/features/catalogos/paises/paisService';
import { filterRowsByEmpresa, useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { OverlayOutlet } from '@/shared/components/OverlayOutlet';
import { RegisterButton } from '@/shared/components/RecordActions';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

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
  const { idActiva } = useEmpresaActiva();
  const allowWrite = canWrite('sedes');
  const { rows, isLoading, errorMessage, banner, setBanner, reload } =
    useCatalogCollection(sedeService.getAll);
  const scopedRows = useMemo(
    () => filterRowsByEmpresa(rows, idActiva),
    [rows, idActiva],
  );
  const empresas = useResource(empresaService.getAll);
  const paises = useResource(paisService.getAll);
  const empresaNombres = useMemo(() => nameById(empresas.data), [empresas.data]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const outletContext = useMemo(
    () => ({
      reload,
      rows,
      lookups: {
        empresas: empresas.data,
        paises: paises.data,
        empresaNombres,
      },
    }),
    [empresas.data, empresaNombres, paises.data, reload, rows],
  );

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
        rows={scopedRows}
        loading={isLoading}
        searchPlaceholder="Buscar por nombre, empresa o dirección"
        statusFilter={{ key: 'habilitado' }}
        emptyTitle="No hay sedes"
        emptyDescription="Registre la primera sede para vincularla a una empresa."
        getRowActions={(sede) => ({
          view: { to: `${sede.id}` },
          edit: allowWrite ? { to: `${sede.id}/editar` } : undefined,
          remove:
            allowWrite && sede.habilitado === false
              ? {
                  onClick: () => {
                    setDeleteError(null);
                    setPendingDelete(sede);
                  },
                }
              : undefined,
        })}
      />
      <DetailOverlay
        open={Boolean(pendingDelete)}
        title="Eliminar sede"
        kicker="Confirmación"
        onClose={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      >
        <p className="text-base text-navy">
          Se eliminará permanentemente la sede <strong>{pendingDelete?.nombre}</strong>. Esta acción no se
          puede revertir.
        </p>
        {deleteError ? (
          <div className="app-feedback app-feedback--error" role="alert">
            {deleteError}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="app-btn app-btn--primary"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              setDeleteError(null);
              try {
                await sedeService.hardRemove(pendingDelete.id);
                setPendingDelete(null);
                setBanner({ message: 'Sede eliminada.', variant: 'empty' });
                await reload();
              } catch (error) {
                setDeleteError(getErrorMessage(error));
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
          <button
            type="button"
            className="app-btn app-btn--ghost"
            disabled={deleting}
            onClick={() => {
              setPendingDelete(null);
              setDeleteError(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </DetailOverlay>
      <OverlayOutlet context={outletContext} />
    </section>
  );
}
