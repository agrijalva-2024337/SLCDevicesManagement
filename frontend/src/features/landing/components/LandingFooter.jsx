import { Link } from 'react-router';
import slcMark from '@/assets/slc-mark.svg';
import { footerContent } from '@/features/landing/data/contenido';

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-accent" />

      <div className="landing-footer-grid">
        <div className="landing-footer-brand">
          <div className="flex items-center gap-3">
            <img src={slcMark} alt="" className="h-9 w-9" />
            <p className="font-display text-2xl font-extrabold tracking-display text-text-on-dark">
              {footerContent.wordmark}
            </p>
          </div>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-text-on-dark-muted">
            {footerContent.descripcion}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 text-sm font-bold hover:bg-accent-hover"
            style={{ color: 'var(--palette-white)' }}
          >
            {footerContent.cta}
          </Link>
        </div>

        {footerContent.columnas.map((columna) => (
          <div key={columna.titulo}>
            <p className="text-base font-semibold text-text-on-dark">{columna.titulo}</p>
            <ul className="mt-4 space-y-3">
              {columna.enlaces.map((enlace) => (
                <li key={enlace.label}>
                  {enlace.href.startsWith('/') ? (
                    <Link
                      to={enlace.href}
                      className="text-base text-text-on-dark-muted transition-colors hover:text-text-on-dark"
                    >
                      {enlace.label}
                    </Link>
                  ) : (
                    <a
                      href={enlace.href}
                      className="text-base text-text-on-dark-muted transition-colors hover:text-text-on-dark"
                    >
                      {enlace.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="landing-footer-bar">
        <p>{footerContent.copyright}</p>
        <p className="landing-footer-legal">{footerContent.legal}</p>
      </div>
    </footer>
  );
}
