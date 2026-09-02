import { Link } from 'react-router';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { BentoItem } from '@/shared/vendor/react-bits/MagicBento';

export function RecordCard({
  to,
  title,
  facts = [],
  active = true,
  statusLabel,
  badge,
  showStatus = true,
  onClick,
  hint = 'Ver ficha',
  actions,
}) {
  const inner = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">{title}</h3>
        {badge ??
          (showStatus ? (
            statusLabel ? (
              <StatusBadge active={active} activeLabel={statusLabel.on} inactiveLabel={statusLabel.off} />
            ) : (
              <StatusBadge active={active} />
            )
          ) : null)}
      </div>
      {facts.length > 0 ? (
        <ul className="mt-3 space-y-1 text-base text-navy">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}
      {actions ? (
        <div className="magic-bento-card__actions">{actions}</div>
      ) : (
        <span className="magic-bento-card__hint">
          {hint}
          <i className="pi pi-arrow-right text-xs" aria-hidden="true" />
        </span>
      )}
    </>
  );

  return (
    <BentoItem>
      {actions ? (
        <div className="magic-bento-card__body magic-bento-card__body--static">{inner}</div>
      ) : to ? (
        <Link to={to} className="magic-bento-card__body">
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="magic-bento-card__body">
          {inner}
        </button>
      )}
    </BentoItem>
  );
}
