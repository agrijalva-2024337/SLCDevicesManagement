import { Link } from 'react-router';
import { CirculosHero } from '@/features/landing/components/CirculosHero';
import { heroContent } from '@/features/landing/data/contenido';
import { Reveal } from '@/shared/components/Reveal';

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-svh scroll-mt-[var(--header-height)] flex-col justify-center overflow-hidden bg-linear-to-br from-navy to-navy-mid pt-[var(--header-height)] text-text-on-dark"
    >
      <div className="mx-auto grid w-full max-w-[var(--container-max)] items-center gap-12 px-4 py-[var(--section-space)] sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Reveal className="relative z-10">
          <h1 className="font-display text-hero font-extrabold tracking-display leading-display">
            <span className="hidden sm:block">
              {heroContent.titleLineasEscritorio[0]}
              <br />
              {heroContent.titleLineasEscritorio[1]}
            </span>
            <span className="sm:hidden">
              {heroContent.titleLineasMovil.map((linea) => (
                <span key={linea} className="block">
                  {linea}
                </span>
              ))}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-on-dark-muted">
            {heroContent.descripcion}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-accent px-6 text-base font-bold text-white hover:bg-accent-hover sm:w-auto"
            >
              {heroContent.ctaPrimario}
            </Link>
            <Link
              to="/app"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-text-on-dark px-6 text-base font-bold text-text-on-dark hover:bg-white/10 sm:w-auto"
            >
              {heroContent.ctaSecundario}
            </Link>
          </div>
        </Reveal>

        <div className="pointer-events-none absolute right-[-18%] top-[18%] z-0 h-64 w-64 opacity-50 sm:h-80 sm:w-80 lg:relative lg:right-auto lg:top-auto lg:mx-auto lg:h-[min(28rem,70vw)] lg:w-[min(28rem,70vw)] lg:opacity-100">
          <CirculosHero />
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-text-on-dark-muted md:hidden">
        {heroContent.desliza}
      </p>
    </section>
  );
}
