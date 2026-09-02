import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router';

export function useRecordDeepLink(records, openView) {
  const [params] = useSearchParams();
  const location = useLocation();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current || typeof openView !== 'function') return;
    const raw = location.state?.id ?? params.get('id');
    if (raw == null || raw === '') return;
    const record = records.find((item) => String(item.id) === String(raw));
    if (!record) return;
    opened.current = true;
    openView(record);
  }, [location.state, openView, params, records]);
}
