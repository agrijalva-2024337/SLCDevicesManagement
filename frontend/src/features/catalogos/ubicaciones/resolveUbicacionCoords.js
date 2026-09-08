import { geocodeAddress } from '@/shared/geo/geocodeAddress';

function part(value) {
  return String(value ?? '').trim();
}

export function buildUbicacionGeocodeQuery({ nombre, descripcion, sede, paisNombre } = {}) {
  const country = part(paisNombre) || 'Guatemala';
  if (sede?.direccion) {
    return [sede.direccion, sede.ciudad, country].map(part).filter(Boolean).join(', ');
  }
  return [nombre, descripcion, sede?.nombre, country].map(part).filter(Boolean).join(', ');
}

export async function resolveUbicacionCoords(payload, sede, paisNombre) {
  const hasLat = payload.latitud != null && payload.latitud !== '';
  const hasLng = payload.longitud != null && payload.longitud !== '';
  if (hasLat && hasLng) {
    return payload;
  }

  const query = buildUbicacionGeocodeQuery({
    nombre: payload.nombre,
    descripcion: payload.descripcion,
    sede,
    paisNombre,
  });
  const point = await geocodeAddress(query);
  if (!point) {
    throw new Error(
      `No pudimos encontrar coordenadas automáticas para "${query}". ` +
        'Ingresa latitud y longitud manualmente e intenta de nuevo.',
    );
  }

  return {
    ...payload,
    latitud: point.lat,
    longitud: point.lng,
  };
}
