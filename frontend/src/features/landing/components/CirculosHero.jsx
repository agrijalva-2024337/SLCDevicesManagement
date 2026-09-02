export function CirculosHero() {
  const rings = [
    { r: 70, opacity: 0.16 },
    { r: 120, opacity: 0.12 },
    { r: 170, opacity: 0.09 },
    { r: 220, opacity: 0.07 },
    { r: 270, opacity: 0.05 },
  ];

  return (
    <svg
      viewBox="0 0 560 560"
      className="h-full w-full origin-center text-white motion-safe:animate-[spin_48s_linear_infinite]"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="280" cy="280" r="28" fill="currentColor" opacity="0.08" />
      {rings.map((ring) => (
        <circle
          key={ring.r}
          cx="280"
          cy="280"
          r={ring.r}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity={ring.opacity}
        />
      ))}
      <circle cx="280" cy="10" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="490" cy="280" r="4" fill="currentColor" opacity="0.28" />
    </svg>
  );
}
