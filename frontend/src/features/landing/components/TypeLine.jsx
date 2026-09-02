import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';

export function TypeLine({ text, ms = 20, className = '' }) {
  const reduceMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  const shown = reduceMotion ? text : text.slice(0, count);

  useEffect(() => {
    if (reduceMotion) return undefined;

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) window.clearInterval(id);
    }, ms);

    return () => window.clearInterval(id);
  }, [ms, reduceMotion, text]);

  return (
    <span className={`landing-type${className ? ` ${className}` : ''}`}>
      <span className="sr-only">{text}</span>
      <span className="landing-type-sizer" aria-hidden="true">
        {text}
        <span className="landing-type-caret" />
      </span>
      <span className="landing-type-live" aria-hidden="true">
        {shown}
        <span className="landing-type-caret" />
      </span>
    </span>
  );
}
