export function DrillDownPanel({
  title,
  hint,
  stack,
  onChange,
  empty = false,
  emptyMessage = 'No hay datos en el periodo.',
  bare = false,
  children,
}) {
  const atRoot = stack.length === 0;
  const crumbs = [
    { label: title, stack: [] },
    ...stack.map((item, index) => ({ label: item.label, stack: stack.slice(0, index + 1) })),
  ];

  const Tag = bare ? 'div' : 'section';

  return (
    <Tag className={bare ? 'dash-drill' : 'dash-card'}>
      <header className={bare ? 'dash-drill-head' : 'dash-card-head'}>
        {atRoot ? (
          <div>
            <h2>{title}</h2>
            {hint ? <p className="dash-hint">{hint}</p> : null}
          </div>
        ) : (
          <nav className="dash-crumbs" aria-label={`Detalle de ${title}`}>
            <button type="button" className="dash-back" onClick={() => onChange(stack.slice(0, -1))}>
              Volver
            </button>
            <ol>
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`}>
                  {index === crumbs.length - 1 ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <button type="button" onClick={() => onChange(crumb.stack)}>
                      {crumb.label}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </header>

      <div className={bare ? undefined : 'dash-card-body'}>
        {empty ? <p className="dash-empty">{emptyMessage}</p> : children}
      </div>
    </Tag>
  );
}

export function DrillTable({ columns, rows, onRow, emptyMessage = 'No hay registros.' }) {
  if (!rows.length) {
    return <p className="dash-empty">{emptyMessage}</p>;
  }

  return (
    <div className="dash-mini-wrap">
      <table className="dash-mini">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onRow?.(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
