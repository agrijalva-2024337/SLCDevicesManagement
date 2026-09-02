import { Suspense } from 'react';
import { Outlet } from 'react-router';

export function OverlayOutlet() {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}
