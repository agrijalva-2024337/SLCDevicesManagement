import { useEffect, useState } from 'react';

function GeneratedPasswordBlock({ password }) {
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="app-save-success-password">
      <p className="font-semibold text-navy">Contraseña temporal</p>
      <p className="mt-1 text-sm text-text-muted">
        Cópiela ahora: no se podrá recuperar después.
      </p>
      <div className="app-input-password mt-3">
        <input
          className="app-input app-hash"
          type={visible ? 'text' : 'password'}
          value={password}
          readOnly
          aria-label="Contraseña temporal generada"
        />
        <button
          type="button"
          className="app-icon-btn"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((open) => !open)}
        >
          <i className={visible ? 'pi pi-eye-slash' : 'pi pi-eye'} aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="app-btn app-btn--ghost app-btn--sm mt-2" onClick={copyPassword}>
        {copied ? 'Copiada' : 'Copiar'}
      </button>
    </div>
  );
}

/**
 * Pantalla breve post-guardar (crear/editar), sin abrir la ficha completa.
 * @param {{ action: 'created' | 'updated', entityLabel?: string, passwordGenerada?: string | null, onDone: () => void, autoCloseMs?: number }} props
 */
export function SaveSuccessPanel({
  action = 'created',
  entityLabel,
  passwordGenerada,
  onDone,
  autoCloseMs = 2200,
}) {
  const created = action === 'created';
  const title = created ? 'Registrado' : 'Actualizado';
  const entity = entityLabel ? String(entityLabel) : 'registro';
  const subtitle = created
    ? `El ${entity} se registró correctamente.`
    : `Los cambios del ${entity} se guardaron.`;
  const keepOpen = Boolean(passwordGenerada);

  useEffect(() => {
    if (keepOpen || !autoCloseMs) return undefined;
    const timer = window.setTimeout(() => onDone(), autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, keepOpen, onDone]);

  return (
    <div className="app-save-success" role="status" aria-live="polite">
      <div className="app-save-success-mark" aria-hidden="true">
        <i className="pi pi-check" />
      </div>
      <h3 className="app-save-success-title">{title}</h3>
      <p className="app-save-success-text">{subtitle}</p>
      {passwordGenerada ? <GeneratedPasswordBlock password={passwordGenerada} /> : null}
      <button type="button" className="app-btn app-btn--primary mt-6" onClick={onDone}>
        Continuar
      </button>
    </div>
  );
}

export function saveSuccessResult({ created, entityLabel, passwordGenerada } = {}) {
  return {
    action: created ? 'created' : 'updated',
    entityLabel: entityLabel ?? null,
    passwordGenerada: passwordGenerada ?? null,
  };
}
