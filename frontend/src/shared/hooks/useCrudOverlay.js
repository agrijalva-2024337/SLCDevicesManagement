import { useState } from 'react';

export function useCrudOverlay() {
  const [state, setState] = useState({ mode: 'closed', record: null });

  return {
    mode: state.mode,
    record: state.record,
    isView: state.mode === 'view',
    isForm: state.mode === 'create' || state.mode === 'edit',
    isCreate: state.mode === 'create',
    isEdit: state.mode === 'edit',
    openView: (record) => setState({ mode: 'view', record }),
    openCreate: () => setState({ mode: 'create', record: null }),
    openEdit: (record) => setState({ mode: 'edit', record }),
    close: () => setState({ mode: 'closed', record: null }),
  };
}
