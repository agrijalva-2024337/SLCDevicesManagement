import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { Tooltip } from '@/shared/components/Tooltip';

const INLINE_LIMIT = 2;

function splitActions(actions) {
  const list = actions ?? [];
  if (list.length <= 3) {
    return { visible: list, overflow: [] };
  }

  const visible = [];
  const overflow = [];
  for (const action of list) {
    if (visible.length < INLINE_LIMIT && (action.key === 'view' || action.key === 'edit')) {
      visible.push(action);
    } else {
      overflow.push(action);
    }
  }

  while (visible.length < INLINE_LIMIT && overflow.length > 0) {
    visible.push(overflow.shift());
  }

  return { visible, overflow };
}

function actionClassName(action, extra = '') {
  const enabled = action.enabled !== false;
  const tone = action.tone ?? (action.danger ? 'danger' : 'view');
  return ['data-icon-btn', `data-icon-btn--${tone}`, enabled ? '' : 'is-disabled', extra]
    .filter(Boolean)
    .join(' ');
}

function ActionIcon({ action, onAction }) {
  const enabled = action.enabled !== false;
  const tooltip = enabled ? action.label : (action.disabledReason ?? action.label);

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
    <Tooltip label={tooltip} delay={40}>
      {action.to && enabled ? (
        <Link to={action.to} className={actionClassName(action)} aria-label={action.label} onClick={handleClick}>
          {icon}
        </Link>
      ) : (
        <button
          type="button"
          className={actionClassName(action)}
          aria-label={action.label}
          aria-disabled={enabled ? undefined : true}
          onClick={handleClick}
        >
          {icon}
        </button>
      )}
    </Tooltip>
  );
}

function MoreMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const anchor = rootRef.current.getBoundingClientRect();
    const width = panelRef.current?.offsetWidth ?? 208;
    const left = Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12));
    setCoords({ top: anchor.bottom + 6, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onDoc(event) {
      if (rootRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    }

    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    function onReposition() {
      setOpen(false);
    }

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  return (
    <div className="data-row-more" ref={rootRef}>
      <Tooltip label={open ? 'Cerrar acciones' : 'Más acciones'} delay={40}>
        <button
          type="button"
          className="data-icon-btn data-icon-btn--view"
          aria-label="Más acciones"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <i className="pi pi-ellipsis-h" aria-hidden="true" />
        </button>
      </Tooltip>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="data-row-more-panel"
              role="menu"
              style={{ top: coords.top, left: coords.left }}
            >
              {actions.map((action) => {
            const enabled = action.enabled !== false;
            const tone = action.tone ?? (action.danger ? 'danger' : 'view');
            const className = [
              'data-row-more-item',
              `is-${tone}`,
              enabled ? '' : 'is-disabled',
            ]
              .filter(Boolean)
              .join(' ');
            const label = enabled ? action.label : (action.disabledReason ?? action.label);

            function handleClick(event) {
              event.stopPropagation();
              if (!enabled) {
                event.preventDefault();
                return;
              }
              setOpen(false);
              onAction?.(action, event);
            }

            if (action.to && enabled) {
              return (
                <Link key={action.key} to={action.to} className={className} role="menuitem" onClick={handleClick}>
                  <i className={action.icon} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            }

            return (
              <button
                key={action.key}
                type="button"
                className={className}
                role="menuitem"
                aria-disabled={enabled ? undefined : true}
                onClick={handleClick}
              >
                <i className={action.icon} aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function RowIconActions({ actions, onAction }) {
  const { visible, overflow } = splitActions(actions);

  return (
    <div className="data-row-actions">
      {visible.map((action) => (
        <ActionIcon key={action.key} action={action} onAction={onAction} />
      ))}
      {overflow.length > 0 ? <MoreMenu actions={overflow} onAction={onAction} /> : null}
    </div>
  );
}
