export function parseCoordinates(latitud, longitud) {
  if (latitud == null || longitud == null) return null;
  if (String(latitud).trim() === '' || String(longitud).trim() === '') return null;
  const lat = Number(latitud);
  const lng = Number(longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function formatCoordinates({ lat, lng }) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
