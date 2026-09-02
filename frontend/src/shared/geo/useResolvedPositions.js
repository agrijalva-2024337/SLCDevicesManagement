import { useEffect, useMemo, useState } from 'react';
import { geocodeAddress } from '@/shared/geo/geocodeAddress';
import { parseCoordinates } from '@/shared/geo/parseCoordinates';

function geocodeQuery(item) {
  return [item.direccion, item.nombre, item.descripcion].filter(Boolean).join(', ');
}

export function useResolvedPositions(items) {
  const [geocoded, setGeocoded] = useState({});

  const fingerprint = items
    .map((item) => `${item.id}:${item.latitud}:${item.longitud}:${geocodeQuery(item)}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const toGeocode = items.filter((item) => !parseCoordinates(item.latitud, item.longitud) && geocodeQuery(item));
    if (toGeocode.length === 0) return undefined;

    (async () => {
      for (const item of toGeocode) {
        // [API] geocoding externo solo si el DTO no trae latitud/longitud.
        const result = await geocodeAddress(geocodeQuery(item));
        if (cancelled) return;
        setGeocoded((current) =>
          Object.hasOwn(current, item.id) ? current : { ...current, [item.id]: result },
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // fingerprint resume el contenido relevante de items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  return useMemo(
    () =>
      items.map((item) => {
        const fromFields = parseCoordinates(item.latitud, item.longitud);
        const hasGeo = Object.hasOwn(geocoded, item.id);
        const position = fromFields ?? (hasGeo ? geocoded[item.id] : null);
        const locating = !fromFields && Boolean(geocodeQuery(item)) && !hasGeo;
        return {
          ...item,
          position,
          locating,
          missingLocation: !position && !locating,
        };
      }),
    [geocoded, items],
  );
}
