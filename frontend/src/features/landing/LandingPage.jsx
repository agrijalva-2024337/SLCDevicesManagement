import { BandaLineas } from '@/features/landing/components/BandaLineas';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { EstadisticasSection } from '@/features/landing/sections/EstadisticasSection';
import { HeroSection } from '@/features/landing/sections/HeroSection';
import { PerfilesSection } from '@/features/landing/sections/PerfilesSection';
import { PlataformaSection } from '@/features/landing/sections/PlataformaSection';
import { SoporteSection } from '@/features/landing/sections/SoporteSection';

export function LandingPage() {
  return (
    <div className="bg-surface font-sans text-navy">
      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-surface-card focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <LandingHeader />
      <main>
        <HeroSection />
        <BandaLineas />
        <PerfilesSection />
        <PlataformaSection />
        <EstadisticasSection />
        <SoporteSection />
      </main>
      <LandingFooter />
    </div>
  );
}
