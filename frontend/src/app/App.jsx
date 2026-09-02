import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { RouteFallback } from '@/app/RouteFallback';
import { router } from '@/app/routes';

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
