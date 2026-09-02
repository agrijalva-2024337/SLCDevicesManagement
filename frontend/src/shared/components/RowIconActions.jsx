import { Tooltip } from '@/shared/components/Tooltip';
import { Link } from 'react-router';

export function RowIconActions({ actions, onAction }) {
  return (
    <div className="data-row-actions">
      {actions.map((action) => {
        const enabled = action.enabled !== false;
        const tooltip = enabled ? action.label : (action.disabledReason ?? action.label);
        const tone = action.tone ?? (action.danger ? 'danger' : 'view');
        const className = [
          'data-icon-btn',
          `data-icon-btn--${tone}`,
          enabled ? '' : 'is-disabled',
        ]
          .filter(Boolean)
          .join(' ');

        function handleClick(event) {
          event.stopPropagation();
          if (!enabled) {
            event.preventDefault();
            return;
          }
          onAction?.(action, event);
        }

        const icon = <i className={action.icon} aria-hidden="true" />;

        return (
          <Tooltip key={action.key} label={tooltip} delay={40}>
            {action.to && enabled ? (
              <Link to={action.to} className={className} aria-label={action.label} onClick={handleClick}>
                {icon}
              </Link>
            ) : (
              <button
                type="button"
                className={className}
                aria-label={action.label}
                aria-disabled={enabled ? undefined : true}
                onClick={handleClick}
              >
                {icon}
              </button>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
}
