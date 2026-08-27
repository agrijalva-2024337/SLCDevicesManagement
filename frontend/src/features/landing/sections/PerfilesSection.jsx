import { perfiles, perfilesIntro } from '@/features/landing/data/perfiles';
import { Reveal } from '@/shared/components/Reveal';

export function PerfilesSection() {
  return (
    <section
      id="perfiles"
      className="scroll-mt-[var(--header-height)] bg-lavender py-[var(--section-space)]"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-text">
            {perfilesIntro.kicker}
          </p>
          <h2 className="mt-3 font-display text-section font-bold tracking-display text-navy">
            {perfilesIntro.titulo}
          </h2>
          <p className="mt-3 text-text-muted">{perfilesIntro.descripcion}</p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {perfiles.map((perfil, index) => (
            <Reveal key={perfil.id} delay={index * 0.07}>
              <article className="group relative h-full overflow-hidden rounded-lg border border-border bg-surface-card p-5 shadow-sm">
                <span className="absolute inset-y-0 left-0 w-1 bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-lavender text-navy">
                  <i className={perfil.icono} aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy">{perfil.nombre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{perfil.descripcion}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
