import { geocodeAddress } from '@/shared/geo/geocodeAddress';

export async function resolveUbicacionCoords(payload, sedeNombre) {
  const hasLat = payload.latitud != null && payload.latitud !== '';
  const hasLng = payload.longitud != null && payload.longitud !== '';
  if (hasLat && hasLng) {
    return payload;
  }

  const query = [payload.nombre, payload.descripcion, sedeNombre, 'Guatemala']
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const point = await geocodeAddress(query);
  if (!point) {
    return payload;
  }

  return {
    ...payload,
    latitud: point.lat,
    longitud: point.lng,
  };
}
