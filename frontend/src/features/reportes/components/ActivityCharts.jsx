function sparkPath(values, width, height, pad = 3) {
  const inset = typeof pad === 'number' ? { top: pad, right: 0, bottom: pad, left: 0 } : pad;
  const points = values.length ? values : [0];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = Math.max(points.length - 1, 1);
  const range = max - min || 1;
  const usable = Math.max(height - inset.top - inset.bottom, 1);
  const coords = points.map((value, index) => {
    const x = inset.left + (index / span) * (width - inset.left - inset.right);
    const y = height - inset.bottom - ((value - min) / range) * usable;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}

export function Sparkline({ values = [], fill = false }) {
  const width = 160;
  const height = 48;
  const { line, area } = sparkPath(values, width, height);

  return (
    <svg className="dash-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      {fill ? <path d={area} fill="currentColor" opacity="0.16" /> : null}
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function WaveSpark({ values = [] }) {
  const width = 240;
  const height = 56;
  const { line, area } = sparkPath(values, width, height, { top: 18, right: 0, bottom: 0, left: 0 });

  return (
    <svg className="dash-brand-wave" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <path d={area} fill="currentColor" opacity="0.18" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function DualBars({ items, tone1 = 'info', tone2 = 'danger', label1 = 'Altas', label2 = 'Cambios' }) {
  const peak = Math.max(...items.flatMap((item) => [item.value1, item.value2]), 1);

  return (
    <div className="dash-dual">
      <p className="dash-dual-legend">
        <span className={`is-${tone1}`}>{label1}</span>
        <span className={`is-${tone2}`}>{label2}</span>
      </p>
      {items.map((item) => (
        <div key={item.key} className="dash-dual-row">
          <span className="dash-dual-label">{item.label}</span>
          <div className="dash-dual-bars">
            <span className="dash-pstat-track">
              <span className={`dash-pstat-fill is-${tone1}`} style={{ width: `${(item.value1 / peak) * 100}%` }} />
            </span>
            <span className="dash-pstat-track">
              <span className={`dash-pstat-fill is-${tone2}`} style={{ width: `${(item.value2 / peak) * 100}%` }} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressStat({ title, value, percent, tone = 'primary', icon }) {
  return (
    <div className="dash-pstat">
      <div className="dash-pstat-top">
        <span>
          {icon ? <i className={`pi ${icon}`} aria-hidden /> : null}
          {title}
        </span>
        <span className="tabular-nums">
          {value} ({percent}%)
        </span>
      </div>
      <span className="dash-pstat-track">
        <span className={`dash-pstat-fill is-${tone}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </span>
    </div>
  );
}

export function HBarChart({ items, onSelect, total }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  const denom = total ?? max;

  return (
    <div className="dash-hbar">
      {items.map((item) => {
        const interactive = typeof onSelect === 'function';
        const Tag = interactive ? 'button' : 'div';
        const percent = Math.round((item.value / denom) * 100);
        return (
          <Tag
            key={item.key}
            type={interactive ? 'button' : undefined}
            className={`dash-hbar-row${interactive ? ' is-interactive' : ''}`}
            onClick={interactive ? () => onSelect(item) : undefined}
          >
            <span className="dash-hbar-top">
              <span className="dash-hbar-label">
                {item.icon ? <i className={`pi ${item.icon}`} aria-hidden /> : null}
                {item.label ?? item.key}
              </span>
              <span className="dash-hbar-value tabular-nums">
                {item.value} ({percent}%)
              </span>
            </span>
            <span className="dash-hbar-track">
              <span
                className={`dash-hbar-fill${item.tone ? ` is-${item.tone}` : ''}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
