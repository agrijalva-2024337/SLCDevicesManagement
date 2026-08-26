import { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContext } from '@/shared/feedback/toastContext';
import { subscribeHttpErrors } from '@/shared/services/httpErrorBus';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message }) => {
      toastId += 1;
      const id = toastId;
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  useEffect(() => {
    return subscribeHttpErrors((error) => {
      showToast({ type: 'error', message: getErrorMessage(error) });
    });
  }, [showToast]);

  const value = useMemo(() => ({ toasts, showToast, dismiss }), [toasts, showToast, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
