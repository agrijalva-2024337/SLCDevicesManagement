import { Spinner } from '@/shared/components/Spinner';

/**
 * Tabla genérica: no conoce entidades de negocio.
 *
 * @param {object} props
 * @param {{ key: string, header: string, render?: (row: object) => import('react').ReactNode }[]} props.columns
 * @param {object[]} props.rows
 * @param {string} [props.rowKey]
 * @param {boolean} [props.isLoading]
 * @param {string} [props.emptyMessage]
 * @param {{ page: number, pageSize: number, total: number, onPageChange: (page: number) => void }} [props.pagination]
 */
export function DataTable({
  columns,
  rows,
  rowKey = 'id',
  isLoading = false,
  emptyMessage = 'No hay registros para mostrar.',
  pagination,
}) {
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-raised">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-ink-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-muted">
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Cargando...
                  </span>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row[rowKey] ?? index} className="border-t border-line">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-ink">
                      {column.render ? column.render(row) : (row[column.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
          <p>
            Página {pagination.page} de {totalPages} · {pagination.total} registros
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-line px-3 py-1 disabled:opacity-50"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-3 py-1 disabled:opacity-50"
              disabled={pagination.page >= totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
