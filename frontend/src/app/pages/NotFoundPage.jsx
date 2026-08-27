import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-text-muted">Error 404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-display text-navy">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-text-muted">
        La ruta no existe o fue movida. Vuelva al inicio público o al panel interno.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-base font-bold text-white hover:bg-accent-hover"
        >
          Ir al inicio
        </Link>
        <Link
          to="/app"
          className="inline-flex min-h-11 items-center justify-center rounded-sm border border-navy px-5 text-base font-bold text-navy hover:bg-lavender"
        >
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
