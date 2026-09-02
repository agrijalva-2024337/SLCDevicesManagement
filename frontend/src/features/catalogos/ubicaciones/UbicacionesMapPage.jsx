import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAuth } from '@/features/auth/useAuth';
import { iconForLocation } from '@/features/catalogos/ubicaciones/locationIcons';
import { RegisterButton } from '@/shared/components/RecordActions';
import { formatCoordinates } from '@/shared/geo/parseCoordinates';
import { useResolvedPositions } from '@/shared/geo/useResolvedPositions';
import { matchesSearch } from '@/shared/utils/search';
import '@/features/catalogos/ubicaciones/ubicaciones.css';

const DEFAULT_CENTER = [14.6349, -90.5069];
const DEFAULT_ZOOM = 8;
const SINGLE_ZOOM = 16;

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

  if (loading) {
    return <div className="ubicaciones-map-placeholder" aria-hidden="true" />;
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      zoomControl
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

export function UbicacionesMapPage({ items, loading = false }) {
  const searchId = useId();
  const { canWrite } = useAuth();
  const allowWrite = canWrite('ubicaciones');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const markerRefs = useRef({});
  const rowRefs = useRef({});
  const resolved = useResolvedPositions(items);

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) return resolved;
    return resolved.filter((item) => matchesSearch([item.nombre, item.descripcion].join(' '), needle));
  }, [query, resolved]);

  const mapped = useMemo(() => filtered.filter((item) => item.position), [filtered]);
  const activeSelectedId = filtered.some((item) => item.id === selectedId) ? selectedId : null;
  const hasQuery = query.trim() !== '';
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
            {allowWrite ? <RegisterButton to="nueva" label="Registrar ubicación" /> : null}
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
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
              />
            </div>
            <p className="ubicaciones-count" aria-live="polite">
              {loading
                ? 'Cargando…'
                : `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`}
            </p>
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
                    filtered.map((item) => {
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
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId((current) => (current === item.id ? null : current))}
                          onClick={() => selectFromTable(item)}
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
                              {item.habilitado ? 'Habilitado' : 'Inactivo'}
                            </span>
                          </td>
                          <td data-align="right" onClick={(event) => event.stopPropagation()}>
                            <div className="ubicaciones-actions">
                              <Link
                                to={`${item.id}`}
                                className="ubicaciones-action"
                                title="Ver"
                                aria-label={`Ver ${item.nombre}`}
                              >
                                <i className="pi pi-eye" aria-hidden="true" />
                              </Link>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
