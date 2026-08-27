import { footerContent } from '@/features/landing/data/contenido';

export function LandingFooter() {
  return (
    <footer className="bg-navy text-text-on-dark">
      <div className="mx-auto grid max-w-[var(--container-max)] gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-extrabold tracking-display">
            {footerContent.wordmark}
          </p>
          <p className="mt-3 max-w-xs text-sm text-text-on-dark-muted">
            Inventario de activos multiempresa para Sistemas Logísticos y Corporativos, S.A.
          </p>
        </div>

        {footerContent.columnas.map((columna) => (
          <div key={columna.titulo}>
            <p className="text-sm font-semibold">{columna.titulo}</p>
            <ul className="mt-3 space-y-2">
              {columna.enlaces.map((enlace) => (
                <li key={enlace.label}>
                  <a
                    href={enlace.href}
                    className="text-sm text-text-on-dark-muted hover:text-text-on-dark"
                  >
                    {enlace.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border-on-dark py-4 text-center text-xs text-text-on-dark-muted">
        {footerContent.copyright}
      </div>
    </footer>
  );
}
