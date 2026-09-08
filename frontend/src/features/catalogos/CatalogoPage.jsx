import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { SinPermiso } from '@/features/auth/RutaProtegida';
import { getMaestro, nameById } from '@/features/catalogos/maestros';
import { filterRowsByEmpresa, useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import { PaisesGrid } from '@/features/catalogos/paises/PaisesGrid';
import * as paisService from '@/features/catalogos/paises/paisService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { UbicacionesMapPage } from '@/features/catalogos/ubicaciones/UbicacionesMapPage';
import * as empresaService from '@/features/organizacion/empresas/empresaService';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import * as areaService from '@/features/organizacion/areas/areaService';
import { DataTable } from '@/shared/components/DataTable';
import { OverlayOutlet } from '@/shared/components/OverlayOutlet';
import { PageHeader } from '@/shared/components/PageHeader';
import { RecordActions, RegisterButton } from '@/shared/components/RecordActions';
import { RecordCard } from '@/shared/components/RecordCard';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import MagicBento from '@/shared/vendor/react-bits/MagicBento';

export { MaestroDetallePage } from '@/features/catalogos/MaestroDetallePage';
export { MaestroFormPage } from '@/features/catalogos/MaestroFormPage';

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

export function CatalogoPage() {
  const { slug } = useParams();
  const { canWrite } = useAuth();
  const { idActiva } = useEmpresaActiva();
  const allowWrite = canWrite(slug);
  const maestro = getMaestro(slug);
  const canList = !maestro?.requiresWriteToList || allowWrite;
  const loadAll = useCallback(async () => {
    if (!maestro?.service.getAll || !canList) return [];
    if (slug === 'usuarios' && idActiva != null) {
      return maestro.service.getAll({ idEmpresa: idActiva });
    }
    return maestro.service.getAll();
  }, [canList, idActiva, maestro, slug]);
  const { rows, visibleRows, isLoading, errorMessage, banner, reload } = useCatalogCollection(loadAll);
  const empresas = useResource(empresaService.getAll);
  const sedes = useResource(sedeService.getAll);
  const areas = useResource(areaService.getAll);
  const paises = useResource(paisService.getAll);
  const ubicaciones = useResource(ubicacionService.getAll);

  const lookups = useMemo(
    () => ({
      empresas: empresas.data,
      sedes: sedes.data,
      areas: areas.data,
      paises: paises.data,
      ubicaciones: ubicaciones.data,
      empresaNombres: nameById(empresas.data),
      sedeNombres: nameById(sedes.data),
      areaNombres: nameById(areas.data),
      ubicacionNombres: nameById(ubicaciones.data),
    }),
    [areas.data, empresas.data, paises.data, sedes.data, ubicaciones.data],
  );

  const catalogRows = maestro?.hasHabilitado === false ? rows : visibleRows;
  const items = useMemo(() => {
    const withSede = catalogRows.map((row) => {
      if (row.idSede != null) return row;
      if (row.idArea != null) {
        const area = (areas.data ?? []).find((item) => Number(item.id) === Number(row.idArea));
        return area ? { ...row, idSede: area.idSede } : row;
      }
      if (row.idUbicacion == null) return row;
      const ubicacion = (ubicaciones.data ?? []).find((item) => Number(item.id) === Number(row.idUbicacion));
      return ubicacion ? { ...row, idSede: ubicacion.idSede } : row;
    });
    if (maestro?.scope === 'global') {
      return withSede;
    }
    return filterRowsByEmpresa(withSede, idActiva, { sedes: sedes.data });
  }, [areas.data, catalogRows, idActiva, maestro, sedes.data, ubicaciones.data]);
  const outletContext = useMemo(
    () => ({ reload, rows, lookups }),
    [reload, rows, lookups],
  );

  if (!maestro) {
    return (
      <section>
        <PageHeader title="Catálogo" description="Este maestro aún no está disponible." />
        <div className="app-feedback app-feedback--empty">No hay un maestro para esta ruta.</div>
      </section>
    );
  }

  if (maestro.requiresWriteToList && !allowWrite) {
    return <SinPermiso />;
  }

  if (errorMessage) {
    return (
      <section>
        <PageHeader title={maestro.title} description={maestro.description} />
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  if (slug === 'ubicaciones') {
    return (
      <>
        <CatalogBanner banner={banner} />
        <UbicacionesMapPage items={items} loading={isLoading} />
        <OverlayOutlet context={outletContext} />
      </>
    );
  }

  if (slug === 'paises') {
    return (
      <section>
        <CatalogBanner banner={banner} />
        <PaisesGrid items={items} loading={isLoading} />
        <OverlayOutlet context={outletContext} />
      </section>
    );
  }

  if (maestro.listView) {
    return (
      <section>
        <CatalogBanner banner={banner} />
        <DataTable
          title={maestro.title}
          description={maestro.description}
          primaryAction={allowWrite ? <RegisterButton to="nueva" label={maestro.registerLabel} /> : null}
          columns={maestro.listView.columns(lookups)}
          rows={items}
          loading={isLoading}
          searchPlaceholder={`Buscar en ${maestro.title.toLowerCase()}`}
          statusFilter={maestro.hasHabilitado === false ? undefined : { key: 'habilitado' }}
          filters={typeof maestro.listView.filters === 'function' ? maestro.listView.filters(lookups) : undefined}
          emptyTitle={maestro.listView.emptyTitle}
          emptyDescription={maestro.listView.emptyDescription}
          getRowActions={(item) => ({
            view: { to: `${item.id}` },
            edit: allowWrite ? { to: `${item.id}/editar` } : undefined,
            remove:
              allowWrite && maestro.hasHabilitado === false
                ? {
                    onClick: async () => {
                      const ok = window.confirm(
                        `¿Eliminar ${maestro.singular} ${maestro.titleOf(item)}? Esta acción no se puede deshacer.`,
                      );
                      if (!ok) return;
                      await maestro.service.remove(item.id);
                      await reload();
                    },
                  }
                : undefined,
          })}
        />
        <OverlayOutlet context={outletContext} />
      </section>
    );
  }

  return (
    <section>
      <CatalogBanner banner={banner} />
      <PageHeader
        title={maestro.title}
        description={maestro.description}
        actions={allowWrite ? <RegisterButton to="nueva" label={maestro.registerLabel} /> : null}
      />
      {isLoading ? (
        <div className="app-feedback app-feedback--loading" role="status">
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="app-feedback app-feedback--empty">No hay registros para mostrar.</div>
      ) : (
        <MagicBento>
          {items.map((item) => (
            <RecordCard
              key={item.id}
              title={maestro.titleOf(item)}
              facts={maestro.facts(item, lookups)}
              active={item.habilitado}
              showStatus={maestro.hasHabilitado !== false}
              actions={
                <RecordActions
                  viewTo={`${item.id}`}
                  editTo={allowWrite ? `${item.id}/editar` : undefined}
                />
              }
            />
          ))}
        </MagicBento>
      )}
      <OverlayOutlet context={outletContext} />
    </section>
  );
}
