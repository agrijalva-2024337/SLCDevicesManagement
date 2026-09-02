import { Link } from 'react-router';
import slcTradeLogo from '@/assets/slc-mark.svg';
import { AtmosphereBackdrop } from '@/features/landing/components/AtmosphereBackdrop';
import { TypeLine } from '@/features/landing/components/TypeLine';
import { heroContent } from '@/features/landing/data/contenido';

export function HeroSection() {
  return (
    <section id="inicio" className="landing-hero relative isolate overflow-hidden">
      <h1 className="sr-only">SLC Devices Management</h1>

      <AtmosphereBackdrop />

      <div className="landing-hero-content">
        <div className="landing-hero-brand-plate">
          <img className="landing-hero-brand" src={slcTradeLogo} alt="SLCTrade" />
          <p className="landing-hero-kicker">
            <TypeLine text={heroContent.marca} ms={28} />
          </p>
        </div>

        <div className="landing-hero-actions">
          <Link to="/login" className="landing-hero-cta--primary">
            {heroContent.ctaPrimario}
          </Link>
          <Link to="/app" className="landing-hero-cta--ghost">
            {heroContent.ctaSecundario}
          </Link>
        </div>
      </div>
    </section>
  );
}
