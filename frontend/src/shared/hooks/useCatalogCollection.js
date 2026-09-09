import { useEffect, useMemo, useState } from 'react';
import { useQueryResource } from '@/shared/data/useQueryResource';

export function useCatalogCollection(loadFn, options) {
  const { data, isLoading, errorMessage, reload } = useQueryResource(loadFn, options);
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [banner]);

  return {
    rows,
    isLoading,
    errorMessage,
    banner,
    setBanner,
    reload,
  };
}
