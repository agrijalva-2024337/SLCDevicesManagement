/**
 * Data Card del design system: par etiqueta / valor.
 * Fondo neutro, acento de marca (navy) — sin colores semánticos decorativos.
 */

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {import('react').ReactNode} props.value
 * @param {boolean} [props.wide] — ocupa 2 columnas en el grid
 * @param {'card'|'plain'} [props.variant]
 * @param {boolean} [props.accent] — línea vertical de marca a la izquierda
 * @param {string} [props.className]
 */
export function DataCard({
  label,
  value,
  wide = false,
  variant = 'card',
  accent = true,
  className,
}) {
  const display = isEmptyValue(value) ? '—' : value;
  const plain = variant === 'plain';

  return (
    <div
      className={cx(
        'flex min-w-0 max-w-full flex-col text-left',
        plain
          ? 'p-0'
          : cx(
              'rounded-xl border border-slate-200 bg-slate-50 p-4',
              'transition-all duration-200',
              'hover:border-slate-300 hover:bg-white hover:shadow-sm',
              'dark:border-white/10 dark:bg-white/[0.04]',
              'dark:hover:border-white/20 dark:hover:bg-white/[0.07]',
              accent && 'relative overflow-hidden pl-[1.15rem]',
            ),
        wide && 'md:col-span-2',
        className,
      )}
    >
      {!plain && accent ? (
        <span
          className="pointer-events-none absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-[#0c1440] dark:bg-slate-300"
          aria-hidden="true"
        />
      ) : null}
      <p className="m-0 mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className="m-0 break-words text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {display}
      </div>
    </div>
  );
}

/**
 * Contenedor responsive para agrupar DataCards.
 * @param {object} props
 * @param {1|2|3} [props.columns]
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 */
export function DataCardGrid({ columns = 2, children, className }) {
  const cols =
    columns === 3
      ? 'md:grid-cols-3'
      : columns === 1
        ? ''
        : 'md:grid-cols-2';

  return (
    <div className={cx('grid min-w-0 grid-cols-1 gap-4', cols, className)}>{children}</div>
  );
}
