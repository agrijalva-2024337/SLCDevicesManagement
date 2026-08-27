import { PrimeReactProvider } from 'primereact/api';
import { RouterProvider } from 'react-router';
import { router } from '@/app/routes';

function App() {
  return (
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>
  );
}

export default App;
