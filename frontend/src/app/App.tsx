import { ApiStatus } from '@/features/health';
import { AppLayout } from '@/shared/layout/AppLayout';

export function App() {
  return (
    <AppLayout>
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy">
            Hola SLCDevicesManagement
          </h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Andamiaje del frontend listo (FE-01). Las pantallas de negocio se implementan en sprints
            posteriores.
          </p>
        </div>
        <ApiStatus />
      </section>
    </AppLayout>
  );
}
