import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { RouteFallback } from '@/app/RouteFallback';
import { router } from '@/app/routes';
import { AuthProvider } from '@/features/auth/useAuth';

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
