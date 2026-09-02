import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { RegisterButton } from '@/shared/components/RecordActions';
import { matchesSearch } from '@/shared/utils/search';
import '@/features/catalogos/paises/paises.css';

function flagClassName(iso2) {
  const code = String(iso2 ?? '')
    .trim()
    .toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) {
    return null;
  }
  return `fi fi-${code}`;
}

function PaisCard({ pais }) {
  const flagClass = flagClassName(pais.codigoIso2);
  const iso2 = String(pais.codigoIso2 ?? '')
    .trim()
    .toUpperCase();
  const iso3 = String(pais.codigoIso3 ?? '')
    .trim()
    .toUpperCase();
  const phone = String(pais.codigoTelefonico ?? '').trim();

  return (
    <article className="paises-card">
      {flagClass ? <span className={`${flagClass} paises-card-flag`} aria-hidden="true" /> : null}
      <span className="paises-card-veil" aria-hidden="true" />
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
      <Link
        to={`${pais.id}/editar`}
        className="paises-card-edit"
        title="Editar"
        aria-label={`Editar ${pais.nombre}`}
      >
        Editar
      </Link>
    </article>
  );
}

export function PaisesGrid({ items, loading = false }) {
  const searchId = useId();
  const [query, setQuery] = useState('');

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

  return (
    <section className="paises-page">
      <header className="paises-head">
        <h2 className="paises-title">Países</h2>
        <RegisterButton to="nueva" label="Registrar país" />
      </header>

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
            <PaisCard key={pais.id} pais={pais} />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="paises-message">
          <h3>No hay países</h3>
          <p>Registre el primero para usarlo en las sedes.</p>
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
