import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAuth } from '@/features/auth/useAuth';
import { iconForLocation } from '@/features/catalogos/ubicaciones/locationIcons';
import { ExportExcelButton, RegisterButton } from '@/shared/components/RecordActions';
import { formatCoordinates } from '@/shared/geo/parseCoordinates';
import { useResolvedPositions } from '@/shared/geo/useResolvedPositions';
import { matchesSearch } from '@/shared/utils/search';
import '@/features/catalogos/ubicaciones/ubicaciones.css';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [14.6349, -90.5069];
const DEFAULT_ZOOM = 8;
const SINGLE_ZOOM = 18;
const MAX_ZOOM = 22;
const MIN_ZOOM = 3;

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function MapCamera({ points, selected }) {
  const map = useMap();
  const fitKey = points.map((point) => `${point.id}:${point.position.lat}:${point.position.lng}`).join('|');
  const lastFit = useRef('');

  useEffect(() => {
    if (fitKey === lastFit.current) return;
    lastFit.current = fitKey;

    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (points.length === 1) {
      const { lat, lng } = points[0].position;
      map.setView([lat, lng], SINGLE_ZOOM, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points.map((point) => [point.position.lat, point.position.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: SINGLE_ZOOM, animate: true });
  }, [fitKey, map, points]);

  useEffect(() => {
    if (!selected?.position) return;
    const zoom = Math.max(map.getZoom(), SINGLE_ZOOM);
    map.flyTo([selected.position.lat, selected.position.lng], zoom, { duration: 0.55 });
  }, [map, selected?.id, selected?.position]);

  return null;
}

function LocationMarkers({ points, selectedId, hoveredId, onMarkerClick, markerRefs }) {
  return points.map((item) => {
    const selected = selectedId === item.id;
    const hovered = hoveredId === item.id;
    return (
      <Marker
        key={item.id}
        position={[item.position.lat, item.position.lng]}
        icon={iconForLocation({ habilitado: item.habilitado, selected, hovered })}
        zIndexOffset={selected || hovered ? 600 : 0}
        eventHandlers={{
          add: (event) => {
            markerRefs.current[item.id] = event.target;
          },
          remove: () => {
            delete markerRefs.current[item.id];
          },
          click: () => onMarkerClick(item.id),
        }}
      >
        <Popup>
          <p className="ubic-popup-title">{item.nombre}</p>
          {item.descripcion ? <p className="ubic-popup-desc">{item.descripcion}</p> : null}
          <p className="ubic-popup-coords">{formatCoordinates(item.position)}</p>
          <Link to={`${item.id}`} className="ubic-popup-link">
            Ver ficha
          </Link>
        </Popup>
      </Marker>
    );
  });
}

function LocationsMap({ points, selectedId, hoveredId, onMarkerClick, markerRefs, loading }) {
  const selected = points.find((item) => item.id === selectedId) ?? null;
  const mapTilerKey = String(import.meta.env.VITE_MAPTILER_KEY ?? '').trim();

  if (loading) {
    return <div className="ubicaciones-map-placeholder" aria-hidden="true" />;
  }

  if (!mapTilerKey) {
    return (
      <div className="ubicaciones-map-placeholder ubicaciones-map-placeholder--message" role="status">
        <p className="ubicaciones-map-placeholder-title">Mapa no configurado</p>
        <p>Configura <code>VITE_MAPTILER_KEY</code> para ver el mapa.</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      style={{ height: '100%', width: '100%' }}
      zoomControl
      scrollWheelZoom
      doubleClickZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`}
        maxZoom={MAX_ZOOM}
        maxNativeZoom={22}
      />
      <MapResize />
      <MapCamera points={points} selected={selected} />
      <LocationMarkers
        points={points}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onMarkerClick={onMarkerClick}
        markerRefs={markerRefs}
      />
    </MapContainer>
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <tr key={index} className="ubicaciones-skel" aria-hidden="true">
      <td>
        <span className="ubicaciones-skel-bar" style={{ width: '72%' }} />
        <span className="ubicaciones-skel-bar" style={{ width: '48%', marginTop: '0.4rem' }} />
      </td>
      <td>
        <span className="ubicaciones-skel-bar" style={{ width: '84%' }} />
      </td>
      <td>
        <span className="ubicaciones-skel-bar" style={{ width: '4.5rem' }} />
      </td>
      <td data-align="right">
        <span className="ubicaciones-skel-bar" style={{ width: '3.5rem', marginLeft: 'auto' }} />
      </td>
    </tr>
  ));
}

export function UbicacionesMapPage({ items, loading = false, onDelete }) {
  const navigate = useNavigate();
  const searchId = useId();
  const pageSizeId = useId();
  const { canWrite } = useAuth();
  const allowWrite = canWrite('ubicaciones');
  const [liveQuery, setLiveQuery] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const markerRefs = useRef({});
  const rowRefs = useRef({});
  const resolved = useResolvedPositions(items);

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(liveQuery), 280);
    return () => window.clearTimeout(handle);
  }, [liveQuery]);

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) return resolved;
    return resolved.filter((item) => matchesSearch([item.nombre, item.descripcion].join(' '), needle));
  }, [query, resolved]);

  const effectivePageSize = rowsPerPage === 'all' ? null : Number(rowsPerPage);
  const pageCount = effectivePageSize ? Math.max(1, Math.ceil(filtered.length / effectivePageSize)) : 1;
  const safePage = Math.min(Math.max(1, page), pageCount);
  const paged = effectivePageSize
    ? filtered.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize)
    : filtered;
  const from = filtered.length === 0 ? 0 : (safePage - 1) * (effectivePageSize ?? filtered.length) + 1;
  const to = effectivePageSize ? Math.min(safePage * effectivePageSize, filtered.length) : filtered.length;

  const mapped = useMemo(() => filtered.filter((item) => item.position), [filtered]);
  const activeSelectedId = filtered.some((item) => item.id === selectedId) ? selectedId : null;
  const hasQuery = liveQuery.trim() !== '';
  const showEmpty = !loading && items.length === 0;
  const showNoResults = !loading && items.length > 0 && filtered.length === 0;

  function selectFromTable(item) {
    setSelectedId(item.id);
    if (item.position) {
      window.setTimeout(() => markerRefs.current[item.id]?.openPopup(), 520);
    }
  }

  function selectFromMarker(id) {
    setSelectedId(id);
    const row = rowRefs.current[id];
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <section className="ubicaciones-page">
      <div className="ubicaciones-split">
        <div className="ubicaciones-panel">
          <header className="ubicaciones-head">
            <h2 className="ubicaciones-title">Ubicaciones</h2>
            <div className="ubicaciones-head-actions">
              <ExportExcelButton
                title="Ubicaciones"
                columns={[
                  { header: 'Nombre', getValue: (item) => item.nombre },
                  { header: 'Descripción', getValue: (item) => item.descripcion },
                  {
                    header: 'Coordenadas',
                    getValue: (item) =>
                      item.position ? formatCoordinates(item.position) : 'Sin ubicación',
                  },
                  {
                    header: 'Estado',
                    getValue: (item) => (item.habilitado ? 'Habilitado' : 'Deshabilitado'),
                  },
                ]}
                rows={filtered}
              />
              {allowWrite ? <RegisterButton to="nueva" label="Registrar ubicación" /> : null}
            </div>
          </header>

          <div className="ubicaciones-toolbar">
            <div className="ubicaciones-search">
              <label className="ubicaciones-sr" htmlFor={searchId}>
                Buscar ubicaciones
              </label>
              <input
                id={searchId}
                type="search"
                className="app-input"
                placeholder="Buscar por nombre o descripción"
                value={liveQuery}
                onChange={(event) => {
                  setLiveQuery(event.target.value);
                  setPage(1);
                }}
                autoComplete="off"
              />
            </div>
            <p className="ubicaciones-count" aria-live="polite">
              {loading
                ? 'Cargando…'
                : `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`}
            </p>
            {!loading && filtered.length > 0 ? (
              <div className="ubicaciones-page-size">
                <label className="ubicaciones-sr" htmlFor={pageSizeId}>
                  Registros por página
                </label>
                <select
                  id={pageSizeId}
                  className="app-input ubicaciones-page-size-select"
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Registros por página"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="ubicaciones-table-wrap">
            {showEmpty ? (
              <div className="ubicaciones-message">
                <h3>No hay ubicaciones</h3>
                <p>Registre la primera para situarla en el mapa.</p>
              </div>
            ) : null}

            {showNoResults ? (
              <div className="ubicaciones-message">
                <h3>Sin resultados</h3>
                <p>Ninguna ubicación coincide con el nombre o la descripción.</p>
                {hasQuery ? (
                  <div className="ubicaciones-message-actions">
                    <button type="button" className="app-btn app-btn--ghost" onClick={() => setQuery('')}>
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!showEmpty && !showNoResults ? (
              <table className="ubicaciones-table">
                <caption className="ubicaciones-sr">
                  Ubicaciones. Las coordenadas se muestran bajo el nombre.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Estado</th>
                    <th scope="col" data-align="right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows />
                  ) : (
                    paged.map((item) => {
                      const selected = activeSelectedId === item.id;
                      return (
                        <tr
                          key={item.id}
                          ref={(node) => {
                            if (node) rowRefs.current[item.id] = node;
                            else delete rowRefs.current[item.id];
                          }}
                          className={selected ? 'is-selected' : undefined}
                          tabIndex={0}
                          aria-selected={selected}
                          title="Clic para ver en el mapa. Doble clic para abrir la ficha."
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId((current) => (current === item.id ? null : current))}
                          onClick={() => selectFromTable(item)}
                          onDoubleClick={(event) => {
                            if (event.target.closest('a, button')) return;
                            navigate(`${item.id}`);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              selectFromTable(item);
                            }
                          }}
                        >
                          <td>
                            <span className="ubicaciones-name">{item.nombre}</span>
                            <span className={`ubicaciones-coords${item.missingLocation ? ' ubicaciones-missing' : ''}`}>
                              {item.position
                                ? formatCoordinates(item.position)
                                : item.locating
                                  ? 'Localizando…'
                                  : 'Sin ubicación'}
                            </span>
                          </td>
                          <td title={item.descripcion || undefined}>
                            <span className="ubicaciones-ellipsis">{item.descripcion || '—'}</span>
                          </td>
                          <td>
                            <span className={`ubicaciones-badge ${item.habilitado ? 'is-on' : 'is-off'}`}>
                              {item.habilitado ? 'Habilitado' : 'Deshabilitado'}
                            </span>
                          </td>
                          <td data-align="right" onClick={(event) => event.stopPropagation()}>
                            <div className="ubicaciones-actions">
                              {allowWrite ? (
                                <Link
                                  to={`${item.id}/editar`}
                                  className="ubicaciones-action"
                                  title="Editar"
                                  aria-label={`Editar ${item.nombre}`}
                                >
                                  <i className="pi pi-pencil" aria-hidden="true" />
                                </Link>
                              ) : null}
                              {allowWrite && item.habilitado === false && typeof onDelete === 'function' ? (
                                <button
                                  type="button"
                                  className="ubicaciones-action"
                                  title="Eliminar"
                                  aria-label={`Eliminar ${item.nombre}`}
                                  onClick={() => onDelete(item)}
                                >
                                  <i className="pi pi-trash" aria-hidden="true" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : null}
            {!loading && filtered.length > 0 ? (
              <div className="ubicaciones-pager">
                <p className="ubicaciones-pager-count">
                  {from}–{to} de {filtered.length}
                </p>
                {pageCount > 1 ? (
                  <div className="ubicaciones-pager-nav">
                    <button
                      type="button"
                      className="app-btn app-btn--ghost app-btn--sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="app-btn app-btn--ghost app-btn--sm"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage(safePage + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="ubicaciones-map">
          <LocationsMap
            points={mapped}
            selectedId={activeSelectedId}
            hoveredId={hoveredId}
            onMarkerClick={selectFromMarker}
            markerRefs={markerRefs}
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
