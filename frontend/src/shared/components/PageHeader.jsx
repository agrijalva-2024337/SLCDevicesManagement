export function PageHeader({ title, description }) {
  return (
    <header className="mb-8 max-w-3xl">
      <h2 className="font-display text-2xl font-bold tracking-tight text-navy">{title}</h2>
      {description ? <p className="mt-2 text-text-muted">{description}</p> : null}
    </header>
  );
}
