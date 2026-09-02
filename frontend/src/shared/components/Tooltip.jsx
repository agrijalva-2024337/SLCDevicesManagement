import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/shared/styles/tooltip.css';

export function Tooltip({ label, children, delay = 400 }) {
  const tooltipId = useId();
  const anchorRef = useRef(null);
  const tipRef = useRef(null);
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'top' });

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function hide() {
    clearTimer();
    setVisible(false);
  }

  function scheduleShow() {
    clearTimer();
    if (!label) return;
    timerRef.current = window.setTimeout(() => setVisible(true), delay);
  }

  useEffect(() => () => clearTimer(), []);

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current || !tipRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const gap = 8;
    let placement = 'top';
    let top = anchor.top - tip.height - gap;
    if (top < gap) {
      placement = 'bottom';
      top = anchor.bottom + gap;
    }
    const left = Math.min(
      Math.max(gap, anchor.left + anchor.width / 2 - tip.width / 2),
      window.innerWidth - tip.width - gap,
    );
    setCoords({ top, left, placement });
  }, [visible, label]);

  useEffect(() => {
    if (!visible) return undefined;
    function dismiss() {
      hide();
    }
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [visible]);

  return (
    <span
      ref={anchorRef}
      className="app-tooltip-anchor"
      onMouseEnter={scheduleShow}
      onMouseLeave={hide}
      onFocus={scheduleShow}
      onBlur={hide}
      onPointerDown={hide}
    >
      {children}
      {visible && label
        ? createPortal(
            <span
              ref={tipRef}
              id={tooltipId}
              className={`app-tooltip app-tooltip--${coords.placement}`}
              role="tooltip"
              style={{ top: coords.top, left: coords.left }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
