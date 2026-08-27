import { estadisticas, estadisticasIntro } from '@/features/landing/data/estadisticas';
import { Reveal } from '@/shared/components/Reveal';
import { CountUp } from '@/shared/vendor/react-bits/CountUp';

export function EstadisticasSection() {
  return (
    <section
      id="estadisticas"
      className="scroll-mt-[var(--header-height)] bg-navy py-[var(--section-space)] text-text-on-dark"
    >
      <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-on-dark-muted">
            {estadisticasIntro.kicker}
          </p>
          <h2 className="mt-3 font-display text-section font-bold tracking-display">
            {estadisticasIntro.titulo}
          </h2>
          <p className="mt-3 text-text-on-dark-muted">{estadisticasIntro.descripcion}</p>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {estadisticas.map((item, index) => (
            <Reveal key={item.id} delay={index * 0.07}>
              <p className="font-display text-4xl font-extrabold tracking-display sm:text-5xl">
                <CountUp to={item.valor} duration={1.4} separator="," />
              </p>
              <p className="mt-2 text-sm font-medium text-text-on-dark-muted">{item.etiqueta}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
