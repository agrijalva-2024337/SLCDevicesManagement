import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { RouteFallback } from '@/app/RouteFallback';
import { router } from '@/app/routes';

function App() {
  return (
    <AppProviders>
      <Suspense fallback={<RouteFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}

export default App;
