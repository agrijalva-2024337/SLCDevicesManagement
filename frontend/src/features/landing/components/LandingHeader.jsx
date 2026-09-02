import { useEffect, useMemo, useState } from 'react';
import PillNav from '@/shared/vendor/react-bits/PillNav';
import logo from '@/assets/slc-mark.svg';
import { headerNav } from '@/features/landing/data/contenido';

export function LandingHeader() {
  const [activeId, setActiveId] = useState('inicio');

  const items = useMemo(
    () => [
      ...headerNav.map((item) => ({ label: item.label, href: `#${item.id}` })),
      { label: 'Iniciar sesión', href: '/login' },
    ],
    [],
  );

  useEffect(() => {
    const sectionIds = ['inicio', ...headerNav.map((item) => item.id)];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="landing-header pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
      <div className="landing-pill-nav pointer-events-auto w-full max-w-[var(--container-max)] px-0 sm:flex sm:justify-center sm:px-6">
        <PillNav
          logo={logo}
          logoAlt="SLC Devices Management"
          logoHref="#inicio"
          items={items}
          activeHref={`#${activeId}`}
          ease="power2.easeOut"
          baseColor="transparent"
          pillColor="transparent"
          hoveredPillTextColor="var(--color-white)"
          pillTextColor="rgb(253 253 255 / 0.86)"
          initialLoadAnimation={false}
        />
      </div>
    </header>
  );
}
