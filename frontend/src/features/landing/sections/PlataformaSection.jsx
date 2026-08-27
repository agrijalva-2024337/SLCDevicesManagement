import { modulos, modulosIntro } from '@/features/landing/data/modulos';
import { Reveal } from '@/shared/components/Reveal';

export function PlataformaSection() {
  return (
    <section
      id="plataforma"
      className="scroll-mt-[var(--header-height)] bg-surface py-[var(--section-space)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-text">
            {modulosIntro.kicker}
          </p>
          <h2 className="mt-3 font-display text-section font-bold tracking-display text-navy">
            {modulosIntro.titulo}
          </h2>
          <p className="mt-3 text-text-muted">{modulosIntro.descripcion}</p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modulos.map((modulo, index) => (
            <Reveal key={modulo.id} delay={index * 0.07}>
              <article className="h-full rounded-lg border border-border bg-surface-card p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-lavender text-navy">
                  <i className={modulo.icono} aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy">{modulo.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{modulo.descripcion}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
