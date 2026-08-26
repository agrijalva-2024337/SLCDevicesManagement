import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/router';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { ToastProvider } from '@/shared/feedback/ToastProvider';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
