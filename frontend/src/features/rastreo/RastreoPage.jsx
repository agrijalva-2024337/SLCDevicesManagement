import { useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { filtrarPorEmpresaDeUbicacion, nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { formatHaceCuanto, listarRastreo, mapsUrlDe } from '@/features/rastreo/rastreoService';
import { DataTable } from '@/shared/components/DataTable';
import { listQueryKey } from '@/shared/data/queryKeys';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { byId } from '@/shared/utils/format';

function resolveVista(value) {
  return value === 'fuera-de-rango' ? 'fuera-de-rango' : 'todos';
}

export function RastreoPage() {
  const [params] = useSearchParams();
  const vista = resolveVista(params.get('vista'));
  const { idActiva } = useEmpresaActiva();
  const load = useCallback(() => listarRastreo(), []);
  const { rows, isLoading, errorMessage } = useCatalogCollection(load, {
    key: listQueryKey('rastreo'),
  });
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);

  const tableRows = useMemo(
    () =>
      filtrarPorEmpresaDeUbicacion(
        rows,
        idActiva,
        ubicaciones.data,
        sedes.data,
        'idUbicacionAsignada',
      ).map((row) => {
        const asignada = byId(ubicaciones.data, row.idUbicacionAsignada);
        const detectada = byId(ubicaciones.data, row.idUbicacionDetectada);
        return {
          ...row,
          ubicacionAsignadaNombre: nombreUbicacion(asignada),
          ubicacionDetectadaNombre: nombreUbicacion(detectada),
          haceCuanto: formatHaceCuanto(row.ultimoUsoEn),
          fuente: 'Inferida por Wi-Fi',
          mapsUrl: mapsUrlDe(detectada ?? asignada),
          alerta: row.fueraDeRango ? 'Fuera de rango' : 'En rango',
        };
      }),
    [idActiva, rows, sedes.data, ubicaciones.data],
  );

  const visibleRows = vista === 'fuera-de-rango' ? tableRows.filter((row) => row.fueraDeRango) : tableRows;

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
      <nav className="app-vista-nav" aria-label="Vistas de rastreo">
        <Link
          to="/app/rastreo"
          className={`app-vista-nav__tab ${vista === 'todos' ? 'is-active' : ''}`}
          aria-current={vista === 'todos' ? 'page' : undefined}
        >
          <i className="pi pi-map" aria-hidden="true" />
          Todos
        </Link>
        <Link
          to="/app/rastreo?vista=fuera-de-rango"
          className={`app-vista-nav__tab ${vista === 'fuera-de-rango' ? 'is-active' : ''}`}
          aria-current={vista === 'fuera-de-rango' ? 'page' : undefined}
        >
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          Fuera de rango
        </Link>
      </nav>

      <DataTable
        title={vista === 'fuera-de-rango' ? 'Equipos fuera de rango' : 'Rastreo de equipos'}
        description="Última ubicación detectada por el agente. Las coordenadas salen de la ubicación; el mapa abre Google Maps."
        columns={[
          { key: 'nombreActivo', header: 'Activo', primary: true },
          { key: 'ubicacionAsignadaNombre', header: 'Ubicación asignada' },
          { key: 'ubicacionDetectadaNombre', header: 'Última detectada' },
          {
            key: 'alerta',
            header: 'Rango',
            type: 'badge',
            tone: (row) => (row.fueraDeRango ? 'danger' : 'success'),
          },
          {
            key: 'haceCuanto',
            header: 'Última señal',
            sortValue: (row) => row.ultimoUsoEn,
          },
          { key: 'fuente', header: 'Origen' },
        ]}
        rows={visibleRows}
        loading={isLoading}
        searchPlaceholder="Buscar por activo o ubicación"
        emptyTitle={vista === 'fuera-de-rango' ? 'Nadie está fuera de rango' : 'No hay equipos con agente'}
        emptyDescription={
          vista === 'fuera-de-rango'
            ? 'Cuando un equipo salga del lugar asignado, aparecerá aquí.'
            : 'Cuando un equipo envíe señal, aparecerá aquí.'
        }
        renderRowActions={(row) =>
          row.mapsUrl ? (
            <a
              className="app-btn app-btn--ghost app-btn--sm"
              href={row.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              <i className="pi pi-map-marker" aria-hidden="true" />
              Ver en el mapa
            </a>
          ) : (
            <span className="text-sm text-text-muted">Sin coordenadas</span>
          )
        }
      />
    </section>
  );
}
