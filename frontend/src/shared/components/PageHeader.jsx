import { useLocation } from 'react-router';
import { getPageKicker } from '@/shared/layout/navigation';

export function PageHeader({ kicker, title, description, actions }) {
  const { pathname } = useLocation();
  const label = kicker ?? getPageKicker(pathname);

  return (
    <header className="app-hero mb-8">
      <p className="app-kicker relative z-[1]">{label}</p>
      <h2 className="relative z-[1] mt-2 font-display text-3xl font-extrabold tracking-display sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="relative z-[1] mt-2 max-w-2xl text-base text-text-on-dark-muted sm:text-lg">
          {description}
        </p>
      ) : null}
      {actions ? <div className="relative z-[1] mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
