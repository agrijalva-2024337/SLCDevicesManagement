import './GlassIcons.css';

const gradientMapping = {
  blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
  purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
  red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
  indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
  orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
  green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  navy: 'linear-gradient(hsl(216, 62%, 28%), hsl(228, 68%, 15%))',
  accent: 'linear-gradient(hsl(118, 67%, 39%), hsl(124, 61%, 34%))',
};

const GlassIcons = ({ items, className, onItemActive }) => {
  const getBackgroundStyle = (color) => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] };
    }
    return { background: color };
  };

  return (
    <div className={`icon-btns ${className || ''}`}>
      {items.map((item, index) => (
        <button
          key={item.id || index}
          className={`icon-btn ${item.customClass || ''}`}
          aria-label={item.label}
          aria-pressed={Boolean(item.customClass?.includes('is-active'))}
          type="button"
          onMouseEnter={() => onItemActive?.(item, index)}
          onFocus={() => onItemActive?.(item, index)}
          onClick={() => onItemActive?.(item, index)}
        >
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)} />
          <span className="icon-btn__front">
            <span className="icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="icon-btn__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GlassIcons;
