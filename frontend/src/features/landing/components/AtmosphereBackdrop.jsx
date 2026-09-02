import { HeroScanner } from '@/features/landing/components/HeroScanner';

export function AtmosphereBackdrop() {
  return (
    <div className="landing-atmosphere" aria-hidden="true">
      <div className="landing-atmosphere-orbs" />
      <HeroScanner />
      <div className="landing-atmosphere-veil" />
      <div className="landing-atmosphere-grain" />
    </div>
  );
}
