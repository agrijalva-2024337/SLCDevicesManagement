import { useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBook,
  FiClipboard,
  FiMonitor,
  FiRepeat,
  FiTool,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { TypeLine } from '@/features/landing/components/TypeLine';
import { modulos, modulosIntro } from '@/features/landing/data/modulos';
import { Reveal } from '@/shared/components/Reveal';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import GlassIcons from '@/shared/vendor/react-bits/GlassIcons';

const iconos = {
  book: <FiBook />,
  monitor: <FiMonitor />,
  users: <FiUsers />,
  repeat: <FiRepeat />,
  tool: <FiTool />,
  xCircle: <FiXCircle />,
  clipboard: <FiClipboard />,
  chart: <FiBarChart2 />,
};

export function PlataformaSection() {
  const reduceMotion = usePrefersReducedMotion();
  const [activoId, setActivoId] = useState(modulos[0].id);
  const [paused, setPaused] = useState(false);
  const activo = modulos.find((modulo) => modulo.id === activoId) ?? modulos[0];

  const items = useMemo(
    () =>
      modulos.map((modulo) => ({
        id: modulo.id,
        icon: iconos[modulo.icono],
        color: modulo.color,
        label: modulo.titulo,
        customClass: modulo.id === activoId ? 'is-active' : '',
      })),
    [activoId],
  );

  useEffect(() => {
    if (paused) return undefined;
    const dwell = reduceMotion ? 4200 : Math.max(3800, activo.descripcion.length * 22 + 1400);
    const id = window.setTimeout(() => {
      const index = modulos.findIndex((modulo) => modulo.id === activoId);
      const next = modulos[(index + 1) % modulos.length];
      setActivoId(next.id);
    }, dwell);
    return () => window.clearTimeout(id);
  }, [activo.descripcion.length, activoId, paused, reduceMotion]);

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false);
    }
  }

  return (
    <section id="plataforma" className="landing-modulos scroll-mt-[var(--header-height)]">
      <div className="landing-modulos-inner">
        <Reveal className="landing-modulos-intro">
          <p className="landing-modulos-kicker">{modulosIntro.kicker}</p>
          <h2 className="landing-modulos-heading">{modulosIntro.titulo}</h2>
          <p className="landing-modulos-lead">{modulosIntro.descripcion}</p>
        </Reveal>

        <Reveal className="landing-modulos-stage" delay={0.08}>
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={handleBlur}
          >
            <GlassIcons
              items={items}
              className="landing-modulos-icons"
              onItemActive={(item) => setActivoId(item.id)}
            />
            <div className="landing-modulos-copy">
              <p key={`title-${activo.id}`} className="landing-modulos-copy-title">
                {activo.titulo}
              </p>
              <p className="landing-modulos-copy-text">
                <TypeLine key={activo.id} text={activo.descripcion} ms={18} />
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
