import { Suspense } from 'react';
import { Outlet } from 'react-router';

export function OverlayOutlet({ context }) {
  return (
    <Suspense fallback={null}>
      <Outlet context={context} />
    </Suspense>
  );
}
