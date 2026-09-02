import { Link } from 'react-router';
import { FiClock, FiMail, FiPhone } from 'react-icons/fi';
import { soporteContent } from '@/features/landing/data/contenido';
import { Reveal } from '@/shared/components/Reveal';

const iconos = {
  Correo: FiMail,
  Teléfono: FiPhone,
  Horario: FiClock,
};

export function SoporteSection() {
  return (
    <section id="soporte" className="landing-soporte scroll-mt-[var(--header-height)]">
      <div className="landing-soporte-main">
        <Reveal className="landing-soporte-copy">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">
            {soporteContent.kicker}
          </p>
          <h2 className="mt-3 font-display text-section font-bold tracking-display text-navy">
            {soporteContent.titulo}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-muted">
            {soporteContent.descripcion}
          </p>
          <Link to="/login" className="landing-soporte-cta">
            {soporteContent.cta}
          </Link>
        </Reveal>
      </div>

      <div className="landing-soporte-band">
        {soporteContent.contactos.map((item) => {
          const Icono = iconos[item.label] ?? FiMail;
          return (
            <div key={item.label} className="landing-soporte-cell">
              <span className="landing-soporte-icon" aria-hidden="true">
                <Icono />
              </span>
              <p className="text-base font-semibold text-text-on-dark">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-1 text-lg font-medium text-text-on-dark hover:underline">
                  {item.valor}
                </a>
              ) : (
                <p className="mt-1 text-lg font-medium text-text-on-dark">{item.valor}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
