import { useEffect, useId, useMemo, useRef, useState } from 'react';

function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function labelForValue(options, value) {
  if (value == null || value === '') return '';
  const found = (options ?? []).find((option) => String(option.value) === String(value));
  return found?.label ?? '';
}

/**
 * Select de una sola opción con filtro por texto (combobox).
 * Misma API de opciones que los selects del SchemaForm: `{ value, label, disabled? }`.
 */
export function SearchableSelect({
  id,
  options = [],
  value = '',
  onChange,
  onBlur,
  disabled = false,
  error = false,
  placeholder = 'Seleccione…',
  searchPlaceholder = 'Escriba para buscar…',
  emptyLabel = 'Sin resultados.',
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const selectedLabel = useMemo(() => labelForValue(options, value), [options, value]);
  const displayValue = open ? query : selectedLabel;

  const filtered = useMemo(() => {
    const needle = normalize(query);
    const rows = options ?? [];
    if (!needle) return rows;
    return rows.filter((option) => {
      const haystack = `${option.label ?? ''} ${option.value ?? ''}`;
      return normalize(haystack).includes(needle);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
        onBlur?.();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, onBlur]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.select?.());
  }

  function closeMenu(commitBlur = true) {
    setOpen(false);
    setQuery('');
    if (commitBlur) onBlur?.();
  }

  function selectOption(option) {
    if (disabled || option?.disabled) return;
    onChange(String(option.value));
    closeMenu(true);
  }

  function clearSelection() {
    if (disabled) return;
    onChange('');
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (disabled) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setHighlight((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setHighlight((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      if (!open) return;
      event.preventDefault();
      const option = filtered[highlight];
      if (option && !option.disabled) selectOption(option);
      return;
    }

    if (event.key === 'Tab') {
      closeMenu(true);
    }
  }

  return (
    <div className="app-search-select" ref={rootRef}>
      <div className={`app-search-select-control ${error ? 'app-input--error' : ''}`}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[highlight] ? `${listId}-opt-${highlight}` : undefined}
          className={`app-input app-search-select-input ${!selectedLabel && !open ? 'is-placeholder' : ''}`}
          value={displayValue}
          placeholder={open ? searchPlaceholder : placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={openMenu}
          onClick={openMenu}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget)) {
              // Deja que mousedown del menú gane; el cierre real va por pointer outside.
            }
          }}
        />
        {value != null && value !== '' && !disabled ? (
          <button
            type="button"
            className="app-search-select-clear"
            aria-label="Limpiar selección"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSelection}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        ) : null}
        <span className="app-search-select-caret" aria-hidden="true" />
      </div>

      {open ? (
        <ul id={listId} className="app-search-select-menu" role="listbox">
          {filtered.length === 0 ? (
            <li className="app-search-select-empty" role="presentation">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((option, index) => {
              const optionValue = String(option.value);
              const isSelected = String(value) === optionValue;
              const isActive = index === highlight;
              return (
                <li key={optionValue} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    id={`${listId}-opt-${index}`}
                    className={`app-search-select-option ${isSelected ? 'is-selected' : ''} ${
                      isActive ? 'is-active' : ''
                    }`}
                    disabled={Boolean(option.disabled)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => selectOption(option)}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
