import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

const Scanner = lazy(() => import('@/shared/vendor/react-bits/Scanner'));

export function HeroScanner() {
  const reduceMotion = usePrefersReducedMotion();
  const hostRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const syncTab = () => setTabVisible(document.visibilityState === 'visible');
    syncTab();
    document.addEventListener('visibilitychange', syncTab);
    return () => document.removeEventListener('visibilitychange', syncTab);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const node = hostRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px', threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div ref={hostRef} className="landing-hero-scanner" aria-hidden="true">
      {!reduceMotion && inView && tabVisible ? (
        <Suspense fallback={null}>
          <Scanner
            color1="#0c1440"
            color2="#26a621"
            color3="#fdfdff"
            speed={0.42}
            sweepSpeed={0.22}
            sweepWidth={1.6}
            sweepFalloff={6}
            scale={1.45}
            frequency={2}
            ripple={0.2}
            bandDensity={11}
            lineSharpness={5.5}
            glow={0.26}
            scanDirection="vertical"
            colorSpread={0.55}
            brightness={1.05}
            contrast={1.12}
            softness={1.4}
            vignette={0.5}
            scanline
            grain
            grainIntensity={0.04}
            opacity={1}
            mouseInteraction
            mouseRadius={0.5}
            mouseStrength={0.45}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
