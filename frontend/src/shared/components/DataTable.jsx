import { cloneElement, Fragment, isValidElement, useId, useMemo, useState } from 'react';
import { RowIconActions } from '@/shared/components/RowIconActions';
import { matchesSearch } from '@/shared/utils/search';
import '@/shared/styles/data-table.css';

const BOOLEAN_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Habilitado' },
  { value: 'false', label: 'Deshabilitado' },
];

const BADGE_TONES = {
  success: 'data-badge data-badge--on',
  warning: 'data-badge data-badge--warn',
  danger: 'data-badge data-badge--off',
  muted: 'data-badge data-badge--muted',
  info: 'data-badge data-badge--muted',
};

function ActionSlot({ action }) {
  if (!action) return null;
  return isValidElement(action) ? cloneElement(action) : action;
}

function EmptyMark() {
  return <span className="data-td-empty">—</span>;
}

function isEmptyValue(value) {
  return value == null || value === '' || value === '—';
}

function cellValue(column, row) {
  if (typeof column.getValue === 'function') return column.getValue(row);
  return row[column.key];
}

function cellText(column, row) {
  const value = cellValue(column, row);
  if (value == null || value === false || value === '—') return '';
  if (typeof value === 'boolean') return value ? 'Habilitado' : 'Deshabilitado';
  return String(value);
}

function sortValue(column, row) {
  if (typeof column.sortValue === 'function') return column.sortValue(row);
  if (column.key in row) return row[column.key];
  return cellValue(column, row);
}

function compareValues(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' });
}

function expandColumns(columns) {
  const result = [];
  for (const column of columns) {
    result.push(column.pairWith ? { ...column, pair: 'master' } : column);
    if (column.pairWith) {
      result.push({
        key: column.pairWith.key,
        header: column.pairWith.header,
        getValue: column.pairWith.getValue ?? ((row) => row[column.pairWith.key]),
        search: column.pairWith.search,
        pair: 'slave',
      });
    }
  }
  return result;
}

function withStickyOffsets(columns) {
  let offsetRem = 0;
  return columns.map((column) => {
    if (!column.sticky) return column;
    const widthRem = column.widthRem ?? 10;
    const next = { ...column, stickyOffsetRem: offsetRem, stickyWidthRem: widthRem };
    offsetRem += widthRem;
    return next;
  });
}

function stickyStyle(column) {
  if (!column.sticky) return undefined;
  return {
    '--sticky-left': `${column.stickyOffsetRem}rem`,
    '--sticky-width': `${column.stickyWidthRem}rem`,
  };
}

function normalizeFilters(statusFilter, filters) {
  const list = [];
  if (statusFilter) {
    list.push({
      key: statusFilter.key ?? 'status',
      label: statusFilter.label ?? 'Estado',
      getValue: statusFilter.getValue,
      options: statusFilter.options ?? BOOLEAN_STATUS_OPTIONS,
    });
  }
  if (Array.isArray(filters)) {
    for (const filter of filters) {
      list.push({
        key: filter.key,
        label: filter.label ?? filter.key,
        getValue: filter.getValue,
        options: filter.options ?? BOOLEAN_STATUS_OPTIONS,
      });
    }
  }
  return list;
}

function matchesFilter(row, filter, selected) {
  if (!filter || selected === 'all') return true;
  const raw = typeof filter.getValue === 'function' ? filter.getValue(row) : row[filter.key];
  if (typeof raw === 'boolean') return String(raw) === selected;
  return String(raw ?? '') === selected;
}

function columnSlot(column) {
  if (column.primary) return 'primary';
  if (column.type === 'status' || column.type === 'badge') return 'status';
  return 'field';
}

function columnLabel(column) {
  if (column.pairWith) return `${column.header} / ${column.pairWith.header}`;
  return column.header;
}

function columnClassName(column) {
  return [
    column.primary ? 'data-td--primary' : '',
    column.numeric ? 'data-td--numeric' : '',
    column.mono ? 'data-td--mono' : '',
    column.truncate ? 'data-td--truncate' : '',
    column.sticky ? 'data-td--sticky' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function Badge({ children, tone = 'muted' }) {
  return <span className={BADGE_TONES[tone] ?? BADGE_TONES.muted}>{children}</span>;
}

function StatusBadgeCell({ value, activeLabel = 'Habilitado', inactiveLabel = 'Deshabilitado' }) {
  const on = Boolean(value);
  return <Badge tone={on ? 'success' : 'danger'}>{on ? activeLabel : inactiveLabel}</Badge>;
}

function renderCell(column, row) {
  if (typeof column.render === 'function') {
    return column.render(row, cellValue(column, row));
  }

  if (column.type === 'status') {
    return (
      <StatusBadgeCell
        value={cellValue(column, row)}
        activeLabel={column.activeLabel}
        inactiveLabel={column.inactiveLabel}
      />
    );
  }

  if (column.type === 'badge') {
    const value = cellValue(column, row);
    if (isEmptyValue(value)) return <EmptyMark />;
    const tone = typeof column.tone === 'function' ? column.tone(row, value) : column.tone;
    return <Badge tone={tone}>{value}</Badge>;
  }

  const value = cellValue(column, row);
  if (isEmptyValue(value)) return <EmptyMark />;
  return value;
}

function renderCellContent(column, row) {
  const content = renderCell(column, row);
  const inner = column.pairWith ? (
    <>
      {content}
      <span className="data-pair-inline">
        <span className="data-pair-arrow" aria-hidden="true">
          →
        </span>
        {renderCell(
          {
            key: column.pairWith.key,
            getValue: column.pairWith.getValue ?? ((item) => item[column.pairWith.key]),
            render: column.pairWith.render,
          },
          row,
        )}
      </span>
    </>
  ) : (
    content
  );

  if (!column.truncate) return inner;
  if (isEmptyValue(cellValue(column, row))) return inner;

  return (
    <span className="data-td-clip" title={cellText(column, row)}>
      {inner}
    </span>
  );
}

const ICON_ACTION_META = {
  view: { icon: 'pi pi-eye', tone: 'view', label: 'Ver ficha' },
  edit: { icon: 'pi pi-pencil', tone: 'edit', label: 'Editar' },
};

function iconActionsFromRow(actions) {
  if (!actions) return [];
  return ['view', 'edit']
    .filter((key) => actions[key])
    .map((key) => ({
      key,
      ...ICON_ACTION_META[key],
      label: actions[key].label ?? ICON_ACTION_META[key].label,
      to: actions[key].to,
      onClick: actions[key].onClick,
    }));
}

function SkeletonRows({ columns, withActions, expandable }) {
  return Array.from({ length: 6 }, (_, index) => (
    <tr key={index} aria-hidden="true">
      {expandable ? (
        <td data-slot="expand">
          <span className="data-skel" style={{ width: '0.85rem' }} />
        </td>
      ) : null}
      {columns.map((column, columnIndex) => (
        <td
          key={column.key}
          className={column.sticky ? 'data-td--sticky' : undefined}
          data-slot={columnSlot(column)}
          data-label={columnLabel(column)}
          data-align={column.align ?? (column.numeric ? 'right' : 'left')}
          data-pair={column.pair}
          style={stickyStyle(column)}
        >
          <span className="data-skel" style={{ width: `${72 - columnIndex * 8}%` }} />
        </td>
      ))}
      {withActions ? (
        <td data-slot="actions" data-align="right">
          <span className="data-skel" style={{ width: '4.5rem', marginLeft: 'auto' }} />
        </td>
      ) : null}
    </tr>
  ));
}

function ExpandChevron({ open }) {
  return (
    <i
      className={`pi pi-chevron-right data-table-chevron${open ? ' is-open' : ''}`}
      aria-hidden="true"
    />
  );
}

function TablePager({ page, pageCount, from, to, total, onPageChange }) {
  return (
    <div className="data-table-pager">
      <p className="data-table-pager-count">
        {from}–{to} de {total}
      </p>
      <div className="data-table-pager-nav">
        <button
          type="button"
          className="app-btn app-btn--ghost app-btn--sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="app-btn app-btn--ghost app-btn--sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export function DataTable({
  title,
  description,
  primaryAction,
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  searchPlaceholder = 'Buscar…',
  statusFilter,
  filters,
  emptyTitle = 'No hay registros',
  emptyDescription = 'Cuando existan datos, aparecerán en esta tabla.',
  getRowActions,
  hideHeader = false,
  hideToolbar = false,
  pageSize,
  page,
  onPageChange,
  sortKey,
  sortDirection,
  onSortChange,
  defaultSortKey,
  defaultSortDirection = 'asc',
  minWidth,
  maxHeight,
  expandable = false,
  renderRowActions,
  renderExpandedContent,
  initialFilters,
}) {
  const searchId = useId();
  const filterIdBase = useId();
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState(() => initialFilters ?? {});
  const [internalPage, setInternalPage] = useState(1);
  const [internalSort, setInternalSort] = useState({
    key: defaultSortKey ?? null,
    direction: defaultSortDirection,
  });
  const [expandedId, setExpandedId] = useState(null);
  const expandIdPrefix = useId();
  const canExpand = Boolean(expandable) || typeof getRowActions === 'function';

  const displayColumns = useMemo(() => withStickyOffsets(expandColumns(columns)), [columns]);
  const toolbarFilters = useMemo(
    () => normalizeFilters(statusFilter, filters),
    [statusFilter, filters],
  );
  const withInlineActions = typeof getRowActions === 'function' && !canExpand;
  const activeSortKey = onSortChange ? sortKey : internalSort.key;
  const activeSortDirection = onSortChange ? sortDirection : internalSort.direction;
  const currentPage = onPageChange ? (page ?? 1) : internalPage;

  const filtered = useMemo(() => {
    let next = rows;
    if (!hideToolbar) {
      const needle = query.trim();
      const searchable = displayColumns.filter((column) => column.search !== false);
      next = rows.filter((row) => {
        const passesFilters = toolbarFilters.every((filter) =>
          matchesFilter(row, filter, filterValues[filter.key] ?? 'all'),
        );
        if (!passesFilters) return false;
        if (!needle) return true;
        return searchable.some((column) => matchesSearch(cellText(column, row), needle));
      });
    }

    if (!activeSortKey) return next;
    const column = displayColumns.find((item) => item.key === activeSortKey);
    if (!column) return next;
    const direction = activeSortDirection === 'asc' ? 1 : -1;
    return [...next].sort((left, right) => direction * compareValues(sortValue(column, left), sortValue(column, right)));
  }, [
    activeSortDirection,
    activeSortKey,
    displayColumns,
    filterValues,
    hideToolbar,
    query,
    rows,
    toolbarFilters,
  ]);

  const total = filtered.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(Math.max(1, currentPage), pageCount);
  const paged = pageSize ? filtered.slice((safePage - 1) * pageSize, safePage * pageSize) : filtered;
  const from = total === 0 ? 0 : (safePage - 1) * (pageSize ?? total) + 1;
  const to = pageSize ? Math.min(safePage * pageSize, total) : total;

  const hasFilters =
    query.trim() !== '' || toolbarFilters.some((filter) => (filterValues[filter.key] ?? 'all') !== 'all');
  const showTable = loading || paged.length > 0;
  const showEmpty = !loading && rows.length === 0;
  const showNoResults = !loading && rows.length > 0 && filtered.length === 0;
  const showPager = Boolean(pageSize) && !loading && total > 0;
  const showHead = !hideHeader && (title || description || primaryAction);
  const showToolbar = !hideToolbar;
  const columnCount =
    displayColumns.length + (canExpand ? 1 : 0) + (withInlineActions ? 1 : 0);
  const expandResetKey = `${query}\0${JSON.stringify(filterValues)}\0${safePage}\0${activeSortKey}\0${activeSortDirection}`;
  const [expandResetSeen, setExpandResetSeen] = useState(expandResetKey);
  if (expandResetSeen !== expandResetKey) {
    setExpandResetSeen(expandResetKey);
    setExpandedId(null);
  }

  function clearFilters() {
    setQuery('');
    setFilterValues({});
    setPage(1);
  }

  function setPage(next) {
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  }

  function toggleSort(column) {
    if (!column.sortable) return;
    const nextDirection =
      activeSortKey === column.key && activeSortDirection === 'desc' ? 'asc' : 'desc';
    if (onSortChange) onSortChange(column.key, nextDirection);
    else setInternalSort({ key: column.key, direction: nextDirection });
    setPage(1);
  }

  function rowId(row, index) {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row[rowKey] ?? index;
  }

  function panelIdFor(id) {
    return `${expandIdPrefix}-panel-${id}`;
  }

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function handleRowClick(event, id) {
    if (event.target.closest('button, a, input, select, textarea, label')) return;
    toggleExpand(id);
  }

  function handleRowKeyDown(event, id) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpand(id);
      return;
    }
    if (event.key === 'Escape' && expandedId === id) {
      event.preventDefault();
      setExpandedId(null);
    }
  }

  function handlePanelKeyDown(event, id) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    setExpandedId(null);
    event.currentTarget
      .closest('tbody')
      ?.querySelector(`[data-row-id="${CSS.escape(String(id))}"]`)
      ?.focus();
  }

  const frameStyle = maxHeight ? { maxHeight } : undefined;
  const tableStyle = minWidth ? { minWidth } : undefined;

  return (
    <section className="data-table-page">
      {showHead ? (
        <header className="data-table-head">
          <div className="data-table-head-copy">
            {title ? <h2 className="data-table-title">{title}</h2> : null}
            {description ? <p className="data-table-lead">{description}</p> : null}
          </div>
          {primaryAction ? <div className="data-table-head-actions">{primaryAction}</div> : null}
        </header>
      ) : null}

      {showToolbar ? (
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <label className="data-table-sr" htmlFor={searchId}>
              Buscar
            </label>
            <input
              id={searchId}
              type="search"
              className="app-input"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              autoComplete="off"
            />
          </div>
          {toolbarFilters.map((filter) => {
            const selectId = `${filterIdBase}-${filter.key}`;
            return (
              <div key={filter.key} className="data-table-filter">
                <label className="data-table-sr" htmlFor={selectId}>
                  {filter.label}
                </label>
                <select
                  id={selectId}
                  className="app-input"
                  value={filterValues[filter.key] ?? 'all'}
                  onChange={(event) => {
                    setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }));
                    setPage(1);
                  }}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <p className="data-table-count" aria-live="polite">
            {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`}
          </p>
        </div>
      ) : null}

      <div className="data-table-frame" style={frameStyle} aria-busy={loading || undefined}>
        {showTable ? (
          <table className={`data-table${canExpand ? ' data-table--expandable' : ''}`} aria-label={title} style={tableStyle}>
            <thead>
              <tr>
                {canExpand ? (
                  <th scope="col" className="data-th-expand">
                    <span className="data-table-sr">Expandir</span>
                  </th>
                ) : null}
                {displayColumns.map((column) => {
                  const sorted = activeSortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={column.sticky ? 'data-td--sticky' : undefined}
                      data-align={column.align ?? (column.numeric ? 'right' : 'left')}
                      data-pair={column.pair}
                      aria-sort={
                        sorted ? (activeSortDirection === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                      style={stickyStyle(column)}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          className="data-th-sort"
                          onClick={() => toggleSort(column)}
                        >
                          {column.header}
                          <span className="data-th-sort-mark" aria-hidden="true">
                            {sorted ? (activeSortDirection === 'asc' ? '↑' : '↓') : ''}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {withInlineActions ? (
                  <th scope="col" data-align="right">
                    Acciones
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows
                  columns={displayColumns}
                  withActions={withInlineActions}
                  expandable={canExpand}
                />
              ) : (
                paged.map((row, index) => {
                  const id = rowId(row, index);
                  const open = expandedId === id;
                  const panelId = panelIdFor(id);
                  const iconActions =
                    typeof renderRowActions !== 'function' && typeof getRowActions === 'function'
                      ? iconActionsFromRow(getRowActions(row))
                      : [];
                  return (
                    <Fragment key={id}>
                      <tr
                        data-row-id={id}
                        className={open ? 'is-expanded' : undefined}
                        tabIndex={canExpand ? 0 : undefined}
                        role={canExpand ? 'button' : undefined}
                        aria-expanded={canExpand ? open : undefined}
                        aria-controls={canExpand ? panelId : undefined}
                        onClick={canExpand ? (event) => handleRowClick(event, id) : undefined}
                        onKeyDown={canExpand ? (event) => handleRowKeyDown(event, id) : undefined}
                      >
                        {canExpand ? (
                          <td data-slot="expand">
                            <ExpandChevron open={open} />
                          </td>
                        ) : null}
                        {displayColumns.map((column) => {
                          const align = column.align ?? (column.numeric ? 'right' : 'left');
                          return (
                            <td
                              key={column.key}
                              className={columnClassName(column) || undefined}
                              data-slot={columnSlot(column)}
                              data-label={columnLabel(column)}
                              data-align={align}
                              data-pair={column.pair}
                              style={stickyStyle(column)}
                            >
                              {renderCellContent(column, row)}
                            </td>
                          );
                        })}
                      </tr>
                      {canExpand ? (
                        <tr className={`data-table-expand-row${open ? ' is-open' : ''}`} aria-hidden={!open}>
                          <td colSpan={columnCount} className="data-table-expand-cell">
                            <div
                              className={`data-table-expand-slot${open ? ' is-open' : ''}`}
                              id={panelId}
                              inert={!open || undefined}
                              onKeyDown={(event) => handlePanelKeyDown(event, id)}
                            >
                              <div className="data-table-expand-inner">
                                <div className="data-table-expand-panel">
                                  {typeof renderRowActions === 'function' ? (
                                    <div className="data-table-expand-actions">{renderRowActions(row)}</div>
                                  ) : iconActions.length ? (
                                    <div className="data-table-expand-actions">
                                      <RowIconActions
                                        actions={iconActions}
                                        onAction={(action) => action.onClick?.()}
                                      />
                                    </div>
                                  ) : null}
                                  {typeof renderExpandedContent === 'function'
                                    ? renderExpandedContent(row)
                                    : null}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        ) : null}

        {showEmpty ? (
          <div className="data-table-message">
            <h3>{emptyTitle}</h3>
            <p>{emptyDescription}</p>
            {primaryAction ? (
              <div className="data-table-message-actions">
                <ActionSlot action={primaryAction} />
              </div>
            ) : null}
          </div>
        ) : null}

        {showNoResults ? (
          <div className="data-table-message">
            <h3>Sin resultados</h3>
            <p>Ningún registro coincide con la búsqueda o los filtros.</p>
            {hasFilters ? (
              <div className="data-table-message-actions">
                <button type="button" className="app-btn app-btn--ghost" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {showPager ? (
        <TablePager
          page={safePage}
          pageCount={pageCount}
          from={from}
          to={to}
          total={total}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
