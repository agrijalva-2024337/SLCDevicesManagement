import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { headerNav } from '@/features/landing/data/contenido';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const menuId = 'landing-menu-movil';

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = headerNav.map((item) => document.getElementById(item.id)).filter(Boolean);

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
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const headerClass =
    scrolled || menuOpen
      ? 'bg-navy text-text-on-dark shadow-sm'
      : 'bg-transparent text-text-on-dark';

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${headerClass}`}>
      <div className="mx-auto flex h-[var(--header-height)] max-w-[var(--container-max)] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#inicio" className="font-display text-lg font-extrabold tracking-display">
          SLCDM
        </a>

        <nav aria-label="Secciones de la página" className="hidden items-center gap-8 lg:flex">
          {headerNav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`text-sm font-medium transition-colors ${
                activeId === item.id
                  ? 'text-white'
                  : 'text-text-on-dark-muted hover:text-text-on-dark'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-4 text-base font-bold text-white hover:bg-accent-hover"
          >
            <span className="sm:hidden">Iniciar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm lg:hidden"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i className={menuOpen ? 'pi pi-times' : 'pi pi-bars'} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id={menuId}
          aria-label="Secciones de la página"
          className="border-t border-border-on-dark bg-navy px-4 py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {headerNav.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block rounded-sm px-3 py-3 text-base font-medium text-text-on-dark hover:bg-navy-mid"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
