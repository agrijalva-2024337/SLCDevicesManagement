export function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-lg border border-border bg-surface-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-display text-navy">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-text-muted">{hint}</p> : null}
    </article>
  );
}
