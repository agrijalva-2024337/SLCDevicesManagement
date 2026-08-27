import { Link } from 'react-router';
import { soporteContent } from '@/features/landing/data/contenido';
import { Reveal } from '@/shared/components/Reveal';

export function SoporteSection() {
  return (
    <section
      id="soporte"
      className="scroll-mt-[var(--header-height)] bg-lavender py-[var(--section-space)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-6">
        <Reveal className="rounded-lg border border-border bg-surface-card p-8 shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-text">
            {soporteContent.kicker}
          </p>
          <h2 className="mt-3 font-display text-section font-bold tracking-display text-navy">
            {soporteContent.titulo}
          </h2>
          <p className="mt-3 max-w-2xl text-text-muted">{soporteContent.descripcion}</p>

          <Link
            to="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-sm bg-accent px-6 text-base font-bold text-white hover:bg-accent-hover"
          >
            {soporteContent.cta}
          </Link>

          <dl className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
            {soporteContent.contactos.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-navy">
                  {item.href ? (
                    <a href={item.href} className="hover:underline">
                      {item.valor}
                    </a>
                  ) : (
                    item.valor
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
