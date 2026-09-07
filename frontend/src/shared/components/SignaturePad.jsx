import { useEffect, useRef } from 'react';

export function SignaturePad({ value, onChange, disabled = false }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineWidth = 2;
      context.lineCap = 'round';
      context.strokeStyle = '#0c1440';
      if (value) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, width, height);
        image.src = value;
      } else {
        context.clearRect(0, 0, width, height);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [value]);

  function point(event) {
    const canvas = canvasRef.current;
    const box = canvas.getBoundingClientRect();
    const source = event.touches?.[0] ?? event;
    return { x: source.clientX - box.left, y: source.clientY - box.top };
  }

  function start(event) {
    if (disabled) return;
    event.preventDefault();
    drawing.current = true;
    const context = canvasRef.current.getContext('2d');
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
  }

  function move(event) {
    if (!drawing.current || disabled) return;
    event.preventDefault();
    const context = canvasRef.current.getContext('2d');
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange?.(canvasRef.current.toDataURL('image/png'));
  }

  return (
    <div className="app-signature">
      <canvas
        ref={canvasRef}
        className="app-signature-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="app-signature-bar">
        <button
          type="button"
          className="app-btn app-btn--ghost app-btn--sm"
          disabled={disabled || !value}
          onClick={() => onChange?.('')}
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
