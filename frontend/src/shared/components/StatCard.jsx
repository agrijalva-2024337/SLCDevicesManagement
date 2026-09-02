export function StatCard({ label, value, hint, featured = false }) {
  return (
    <article className={featured ? 'app-kpi app-kpi--featured' : 'app-kpi'}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${featured ? 'text-text-on-dark/60' : 'text-text-muted'}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-display">{value}</p>
      {hint ? (
        <p className={`mt-1 text-sm ${featured ? 'text-text-on-dark-muted' : 'text-text-muted'}`}>{hint}</p>
      ) : null}
    </article>
  );
}
