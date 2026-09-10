import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import * as paisService from '@/features/catalogos/paises/paisService';
import { RegisterButton } from '@/shared/components/RecordActions';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { matchesSearch } from '@/shared/utils/search';
import { iso2Conocido } from '@/shared/validation/paisesIso';
import '@/features/catalogos/paises/paises.css';

function flagClassName(iso2) {
  const code = String(iso2 ?? '')
    .trim()
    .toLowerCase();
  return iso2Conocido(code) ? `fi fi-${code}` : null;
}

function PaisCard({ pais, allowWrite, onDelete, deleting }) {
  const flagClass = flagClassName(pais.codigoIso2);
  const iso2 = String(pais.codigoIso2 ?? '')
    .trim()
    .toUpperCase();
  const iso3 = String(pais.codigoIso3 ?? '')
    .trim()
    .toUpperCase();
  const phone = String(pais.codigoTelefonico ?? '').trim();
  const activo = pais.habilitado !== false;
  const canHardDelete = allowWrite && !activo;

  return (
    <article className={`paises-card${activo ? '' : ' is-inactive'}`}>
      {flagClass ? (
        <span className={`${flagClass} paises-card-flag`} aria-hidden="true" />
      ) : (
        <span className="paises-card-flag paises-card-flag--neutral" aria-hidden="true" />
      )}
      <span className="paises-card-veil" aria-hidden="true" />
      <span className={`paises-card-badge ${activo ? 'is-on' : 'is-off'}`}>
        {activo ? 'Habilitado' : 'Deshabilitado'}
      </span>
      <Link to={`${pais.id}`} className="paises-card-link" aria-label={pais.nombre}>
        <span className="paises-card-name">{pais.nombre}</span>
        <span className="paises-card-meta">
          {[iso2, iso3].filter(Boolean).join(' · ') || '—'}
          {phone ? (
            <>
              <span className="paises-card-div" aria-hidden="true" />
              {phone}
            </>
          ) : null}
        </span>
      </Link>
      {allowWrite ? (
        <div className="paises-card-actions">
          {canHardDelete ? (
            <button
              type="button"
              className="paises-card-delete"
              title="Eliminar país"
              aria-label={`Eliminar ${pais.nombre}`}
              disabled={deleting}
              onClick={() => onDelete?.(pais)}
            >
              <i className="pi pi-trash" aria-hidden="true" />
            </button>
          ) : null}
          <Link
            to={`${pais.id}/editar`}
            className="paises-card-edit"
            title="Editar"
            aria-label={`Editar ${pais.nombre}`}
          >
            Editar
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function PaisesGrid({ items, loading = false, onReload }) {
  const searchId = useId();
  const { canWrite } = useAuth();
  const allowWrite = canWrite('paises');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) {
      return items;
    }
    return items.filter((pais) =>
      matchesSearch([pais.nombre, pais.codigoIso2, pais.codigoIso3].join(' '), needle),
    );
  }, [items, query]);

  const hasQuery = query.trim() !== '';
  const showEmpty = !loading && items.length === 0;
  const showNoResults = !loading && items.length > 0 && filtered.length === 0;

  async function handleDelete(pais) {
    const ok = window.confirm(
      `¿Eliminar permanentemente el país «${pais.nombre}»? Solo se puede borrar si está deshabilitado.`,
    );
    if (!ok) return;

    setDeletingId(pais.id);
    setDeleteError(null);
    try {
      await paisService.hardRemove(pais.id);
      await onReload?.();
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="paises-page">
      <header className="paises-head">
        <div>
          <h2 className="paises-title">Países</h2>
          <p className="paises-lead">Catálogo de la empresa activa. Cada empresa administra los suyos.</p>
        </div>
        {allowWrite ? <RegisterButton to="nueva" label="Registrar país" /> : null}
      </header>

      {deleteError ? (
        <div className="app-feedback app-feedback--error" role="alert">
          {deleteError}
        </div>
      ) : null}

      <div className="paises-toolbar">
        <div className="paises-search">
          <label className="paises-sr" htmlFor={searchId}>
            Buscar países
          </label>
          <input
            id={searchId}
            type="search"
            className="app-input"
            placeholder="Buscar por nombre o código"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>
        <p className="paises-count" aria-live="polite">
          {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`}
        </p>
      </div>

      {loading ? (
        <div className="paises-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="paises-skel" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="paises-grid">
          {filtered.map((pais) => (
            <PaisCard
              key={pais.id}
              pais={pais}
              allowWrite={allowWrite}
              onDelete={handleDelete}
              deleting={Number(deletingId) === Number(pais.id)}
            />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="paises-message">
          <h3>No hay países</h3>
          <p>Registre el primero para usarlo en las sedes de esta empresa.</p>
        </div>
      ) : null}

      {showNoResults ? (
        <div className="paises-message">
          <h3>Sin resultados</h3>
          <p>Ningún país coincide con el nombre o el código buscado.</p>
          {hasQuery ? (
            <div className="paises-message-actions">
              <button type="button" className="app-btn app-btn--ghost" onClick={() => setQuery('')}>
                Limpiar búsqueda
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
