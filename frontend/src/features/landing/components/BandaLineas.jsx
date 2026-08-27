export function BandaLineas() {
  return (
    <div
      aria-hidden="true"
      className="h-16 w-full md:h-20"
      style={{
        backgroundImage: [
          'linear-gradient(to bottom, var(--color-navy), var(--color-lavender))',
          'repeating-linear-gradient(to bottom, rgb(253 253 255 / 0.18) 0 1px, transparent 1px 7px)',
        ].join(', '),
        backgroundBlendMode: 'overlay',
      }}
    />
  );
}
