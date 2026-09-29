import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import '@/features/catalogos/ubicaciones/ubicaciones.css';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [14.6349, -90.5069];
const DEFAULT_ZOOM = 8;

function esCoordUtil(lat, lng) {
  if (lat == null || lng == null) return false;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return false;
  if (Math.abs(latNum) < 0.05 && Math.abs(lngNum) < 0.05) return false;
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
}

function etiquetaOrigen(origen) {
  if (origen === 'gps') return 'GPS del equipo';
  if (origen === 'wifi') return 'Inferida por Wi-Fi';
  return 'Última posición';
}

function puntoDe(row) {
  if (esCoordUtil(row.ultimaLatitud, row.ultimaLongitud)) {
    return {
      lat: Number(row.ultimaLatitud),
      lng: Number(row.ultimaLongitud),
      etiqueta: row.ubicacionDetectada?.nombre ?? etiquetaOrigen(row.origenCoordenada),
    };
  }
  if (esCoordUtil(row.ubicacionDetectada?.latitud, row.ubicacionDetectada?.longitud)) {
    return {
      lat: Number(row.ubicacionDetectada.latitud),
      lng: Number(row.ubicacionDetectada.longitud),
      etiqueta: row.ubicacionDetectada.nombre,
    };
  }
  if (esCoordUtil(row.ubicacionAsignada?.latitud, row.ubicacionAsignada?.longitud)) {
    return {
      lat: Number(row.ubicacionAsignada.latitud),
      lng: Number(row.ubicacionAsignada.longitud),
      etiqueta: `${row.ubicacionAsignada.nombre} (sin GPS; referencia asignada)`,
    };
  }
  return null;
}

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

function MapCamera({ puntos }) {
  const map = useMap();
  const lastFit = useRef('');
  const fitKey = puntos.map((p) => `${p.row.idActivo}:${p.punto.lat}:${p.punto.lng}`).join('|');

  useEffect(() => {
    if (fitKey === lastFit.current) return;
    lastFit.current = fitKey;
    if (puntos.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else if (puntos.length === 1) {
      map.setView([puntos[0].punto.lat, puntos[0].punto.lng], 16, { animate: true });
    } else {
      const bounds = L.latLngBounds(puntos.map((p) => [p.punto.lat, p.punto.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [fitKey, map, puntos]);

  return null;
}

function parrafo(texto, estilo) {
  const p = document.createElement('p');
  p.textContent = texto ?? '';
  Object.assign(p.style, { marginBottom: '4px' }, estilo);
  return p;
}

// Imperativo (no un <CircleMarker> de react-leaflet por punto): con cientos de equipos
// es mucho más liviano y permite el agrupamiento automático de leaflet.markercluster.
function ClusterMarkers({ puntos, onVerFicha }) {
  const map = useMap();
  const groupRef = useRef(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();

    const markers = puntos.map(({ row, punto }) => {
      const marker = L.circleMarker([punto.lat, punto.lng], {
        radius: 10,
        color: row.fueraDeRango ? '#b91c1c' : '#15803d',
        fillColor: row.fueraDeRango ? '#ef4444' : '#22c55e',
        fillOpacity: 0.9,
        weight: 2,
      });

      // textContent (no innerHTML): nombres de activos y ubicaciones son texto libre del usuario.
      const popupNode = document.createElement('div');
      popupNode.append(
        parrafo(row.nombreActivo, { fontWeight: '600' }),
        parrafo(punto.etiqueta),
        parrafo(row.fueraDeRango ? 'Fuera de rango' : 'En ubicación'),
      );
      const link = document.createElement('a');
      link.href = `/app/activos/${row.idActivo}`;
      link.textContent = 'Ver ficha';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        onVerFicha(row.idActivo);
      });
      popupNode.append(link);

      marker.bindPopup(popupNode);
      return marker;
    });

    group.addLayers(markers);
  }, [puntos, onVerFicha]);

  return null;
}

export function RastreoMapView({ rows }) {
  const mapTilerKey = String(import.meta.env.VITE_MAPTILER_KEY ?? '').trim();
  const navigate = useNavigate();

  const verFicha = useCallback((idActivo) => navigate(`/app/activos/${idActivo}`), [navigate]);

  const puntos = useMemo(
    () =>
      (rows ?? [])
        .map((row) => ({ row, punto: puntoDe(row) }))
        .filter((item) => item.punto),
    [rows],
  );

  if (!mapTilerKey) {
    return (
      <div className="ubicaciones-map-placeholder ubicaciones-map-placeholder--message" role="status">
        <p className="ubicaciones-map-placeholder-title">Mapa no configurado</p>
        <p>
          Configura <code>VITE_MAPTILER_KEY</code> para ver el mapa.
        </p>
      </div>
    );
  }

  if (puntos.length === 0) {
    return (
      <div className="ubicaciones-map-placeholder ubicaciones-map-placeholder--message" role="status">
        <p className="ubicaciones-map-placeholder-title">No hay equipos para ubicar en el mapa</p>
        <p>
          El agente debe enviar un ping, o la red Wi-Fi del equipo debe estar catalogada con una
          ubicación que tenga latitud y longitud.
        </p>
      </div>
    );
  }

  return (
    <div className="ubicaciones-map" style={{ height: '520px' }}>
      <div className="rastreo-map-legend">
        <span className="rastreo-map-legend__dot rastreo-map-legend__dot--ok" /> En ubicación
        <span className="rastreo-map-legend__dot rastreo-map-legend__dot--alerta" /> Fuera de rango
      </div>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`}
        />
        <MapResize />
        <MapCamera puntos={puntos} />
        <ClusterMarkers puntos={puntos} onVerFicha={verFicha} />
      </MapContainer>
    </div>
  );
}
