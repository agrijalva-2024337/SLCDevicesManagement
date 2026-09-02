import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

export function Reveal({ children, delay = 0, className = '' }) {
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const visible = reduceMotion || inView;

  useEffect(() => {
    if (reduceMotion) return undefined;

    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div
      ref={ref}
      className={`app-reveal${visible ? ' is-in' : ''}${className ? ` ${className}` : ''}`}
      style={reduceMotion ? undefined : { '--reveal-delay': `${delay}s` }}
    >
      {children}
    </div>
  );
}
