import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="app-auth">
      <div className="app-panel relative z-[1] w-full max-w-lg p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Error 404</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-display text-navy sm:text-4xl">
          Página no encontrada
        </h1>
        <p className="mt-3 text-base text-text-muted">
          La ruta no existe o fue movida. Vuelva al inicio público o al panel interno.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/" className="app-btn app-btn--primary">
            Ir al inicio
          </Link>
          <Link to="/app" className="app-btn app-btn--ghost">
            Ir al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
