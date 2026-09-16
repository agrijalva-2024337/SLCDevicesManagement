import { useEffect, useId, useMemo, useRef, useState } from 'react';

export function MultiSelectDropdown({
  id,
  options = [],
  value = [],
  onChange,
  onBlur,
  disabled = false,
  error = false,
  placeholder = 'Seleccione…',
  emptyLabel = 'No hay opciones disponibles.',
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => (Array.isArray(value) ? value.map(String) : []), [value]);

  const selectedLabels = useMemo(() => {
    const byValue = new Map((options ?? []).map((option) => [String(option.value), option.label]));
    return selected.map((idValue) => byValue.get(idValue) ?? idValue);
  }, [options, selected]);

  const summary =
    selectedLabels.length === 0 ? placeholder : selectedLabels.join(', ');

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        onBlur?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        onBlur?.();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onBlur]);

  function toggleOption(optionValue, optionDisabled) {
    if (disabled || optionDisabled) return;
    const nextValue = String(optionValue);
    const next = selected.includes(nextValue)
      ? selected.filter((idValue) => idValue !== nextValue)
      : [...selected, nextValue];
    onChange(next);
  }

  return (
    <div className="app-multiselect" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`app-multiselect-trigger ${error ? 'app-input--error' : ''} ${
          selectedLabels.length === 0 ? 'is-placeholder' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget)) {
            onBlur?.();
          }
        }}
      >
        <span className="app-multiselect-summary">{summary}</span>
        <span className="app-multiselect-caret" aria-hidden="true" />
      </button>

      {open ? (
        <ul id={listId} className="app-multiselect-menu" role="listbox" aria-multiselectable="true">
          {(options ?? []).length === 0 ? (
            <li className="app-multiselect-empty" role="presentation">
              {emptyLabel}
            </li>
          ) : (
            (options ?? []).map((option) => {
              const optionValue = String(option.value);
              const isSelected = selected.includes(optionValue);
              const optionDisabled = Boolean(option.disabled);
              return (
                <li key={optionValue} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`app-multiselect-option ${isSelected ? 'is-selected' : ''}`}
                    disabled={disabled || optionDisabled}
                    onClick={() => toggleOption(optionValue, optionDisabled)}
                  >
                    <span className="app-multiselect-check" aria-hidden="true">
                      {isSelected ? '✓' : ''}
                    </span>
                    <span>{option.label}</span>
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
