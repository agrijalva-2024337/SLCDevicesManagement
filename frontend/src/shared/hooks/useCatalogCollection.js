import { useEffect, useMemo, useState } from 'react';
import { useQueryResource } from '@/shared/data/useQueryResource';

export function useCatalogCollection(loadFn, options) {
  const { data, isLoading, errorMessage, reload } = useQueryResource(loadFn, options);
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [filter, setFilter] = useState('activos');
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [banner]);

  const visibleRows = useMemo(() => {
    if (filter === 'todos') {
      return rows;
    }

    if (filter === 'inactivos') {
      return rows.filter((row) => !row.habilitado);
    }

    return rows.filter((row) => row.habilitado);
  }, [filter, rows]);

  return {
    rows,
    visibleRows,
    isLoading,
    errorMessage,
    filter,
    setFilter,
    banner,
    setBanner,
    reload,
  };
}
