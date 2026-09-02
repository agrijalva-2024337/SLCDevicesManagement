import './MagicBento.css';

export default function MagicBento({ children, layout = 'list' }) {
  return <div className={`card-grid bento-section magic-bento magic-bento--${layout}`}>{children}</div>;
}

export function BentoItem({ children }) {
  return (
    <div className="magic-bento-wrap">
      <div className="magic-bento-card magic-bento-card--list">{children}</div>
    </div>
  );
}
