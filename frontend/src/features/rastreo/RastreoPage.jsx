import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import { filtrarPorEmpresaDeUbicacion, nombreUbicacion } from '@/features/inventario/trasladoRuta';
import { useEmpresaActiva } from '@/features/organizacion/empresas/useEmpresaActiva';
import * as sedeService from '@/features/organizacion/sedes/sedeService';
import { RastreoMapView } from '@/features/rastreo/RastreoMapView';
import { formatHaceCuanto, generarLinkInstalador, listarRastreo, mapsUrlDe } from '@/features/rastreo/rastreoService';
import { DataTable } from '@/shared/components/DataTable';
import { DetailOverlay } from '@/shared/components/DetailOverlay';
import { listQueryKey } from '@/shared/data/queryKeys';
import { useCatalogCollection } from '@/shared/hooks/useCatalogCollection';
import { useResource } from '@/shared/hooks/useResource';
import { byId } from '@/shared/utils/format';

function resolveVista(value) {
  if (value === 'fuera-de-rango') return 'fuera-de-rango';
  if (value === 'mapa') return 'mapa';
  return 'todos';
}

const RASTREO_COLUMNS = [
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
];

export function RastreoPage() {
  const [params] = useSearchParams();
  const vista = resolveVista(params.get('vista'));
  const { idActiva } = useEmpresaActiva();
  const { canWrite } = useAuth();
  const allowWrite = canWrite('rastreo');
  const load = useCallback(() => listarRastreo(), []);
  const { rows, isLoading, errorMessage } = useCatalogCollection(load, {
    key: listQueryKey('rastreo'),
  });
  const ubicaciones = useResource(ubicacionService.getAll);
  const sedes = useResource(sedeService.getAll);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [copied, setCopied] = useState(false);

  const tableRows = useMemo(() => {
    const enriched = (rows ?? []).map((row) => ({
      ...row,
      idUbicacionAsignada: row.idUbicacionAsignada ?? row.ubicacionAsignada?.id ?? null,
      idUbicacionDetectada: row.idUbicacionDetectada ?? row.ubicacionDetectada?.id ?? null,
    }));

    return filtrarPorEmpresaDeUbicacion(
      enriched,
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
        fuente:
          row.origenCoordenada === 'gps'
            ? 'GPS del equipo'
            : row.origenCoordenada === 'wifi'
              ? 'Inferida por Wi-Fi'
              : 'Sin origen',
        mapsUrl: mapsUrlDe(detectada ?? asignada),
        alerta: row.fueraDeRango ? 'Fuera de rango' : 'En rango',
      };
    });
  }, [idActiva, rows, sedes.data, ubicaciones.data]);

  const visibleRows = useMemo(
    () => (vista === 'fuera-de-rango' ? tableRows.filter((row) => row.fueraDeRango) : tableRows),
    [tableRows, vista],
  );

  async function onGenerarLink() {
    setLinkBusy(true);
    setLinkError(null);
    setCopied(false);
    try {
      const data = await generarLinkInstalador();
      setLinkUrl(data?.url ?? '');
      setLinkOpen(true);
    } catch (err) {
      setLinkError(err?.response?.data?.detail ?? err?.message ?? 'No se pudo generar el link.');
      setLinkOpen(true);
    } finally {
      setLinkBusy(false);
    }
  }

  async function onCopiar() {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (errorMessage) {
    return (
      <section>
        <div className="app-feedback app-feedback--error" role="alert">
          {errorMessage}
        </div>
      </section>
    );
  }

  const generarLinkButton = allowWrite ? (
    <button
      type="button"
      className="app-btn app-btn--primary"
      disabled={linkBusy}
      onClick={onGenerarLink}
    >
      <i className="pi pi-download" aria-hidden="true" />
      {linkBusy ? 'Generando…' : 'Generar link de instalación del agente'}
    </button>
  ) : null;

  return (
    <section>
      <nav className="app-vista-nav" aria-label="Vistas de rastreo">
        <Link
          to="/app/rastreo"
          className={`app-vista-nav__tab ${vista === 'todos' ? 'is-active' : ''}`}
          aria-current={vista === 'todos' ? 'page' : undefined}
        >
          <i className="pi pi-list" aria-hidden="true" />
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
        <Link
          to="/app/rastreo?vista=mapa"
          className={`app-vista-nav__tab ${vista === 'mapa' ? 'is-active' : ''}`}
          aria-current={vista === 'mapa' ? 'page' : undefined}
        >
          <i className="pi pi-map" aria-hidden="true" />
          Mapa
        </Link>
      </nav>

      {vista === 'mapa' ? (
        <div className="mt-4 flex flex-col gap-3">
          {generarLinkButton ? <div className="flex justify-end">{generarLinkButton}</div> : null}
          {isLoading ? (
            <p className="text-sm text-text-muted">Cargando equipos…</p>
          ) : (
            <RastreoMapView rows={tableRows} />
          )}
        </div>
      ) : (
        <DataTable
          title={vista === 'fuera-de-rango' ? 'Equipos fuera de rango' : 'Rastreo de equipos'}
          columns={RASTREO_COLUMNS}
          rows={visibleRows}
          loading={isLoading}
          searchPlaceholder="Buscar por activo o ubicación"
          emptyTitle={vista === 'fuera-de-rango' ? 'Nadie está fuera de rango' : 'No hay equipos con agente'}
          emptyDescription={
            vista === 'fuera-de-rango'
              ? 'Cuando un equipo salga del lugar asignado, aparecerá aquí.'
              : 'Cuando un equipo envíe señal, aparecerá aquí.'
          }
          primaryAction={generarLinkButton}
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
      )}

      <DetailOverlay
        open={linkOpen}
        title="Link de instalación del agente"
        kicker="Rastreo"
        onClose={() => {
          setLinkOpen(false);
          setLinkError(null);
          setCopied(false);
        }}
      >
        {linkError ? (
          <div className="app-feedback app-feedback--error" role="alert">
            {linkError}
          </div>
        ) : (
          <>
            <p className="text-base text-navy">
              Este link vence en 24 horas y sirve para cualquier equipo que necesites activar en ese
              tiempo.
            </p>
            <label className="mt-4 block text-sm font-medium text-navy" htmlFor="instalador-link-url">
              URL de descarga
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                id="instalador-link-url"
                className="app-input min-w-0 flex-1"
                type="text"
                value={linkUrl}
                readOnly
              />
              <button type="button" className="app-btn app-btn--primary" onClick={onCopiar}>
                <i className="pi pi-copy" aria-hidden="true" />
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </>
        )}
      </DetailOverlay>
    </section>
  );
}
