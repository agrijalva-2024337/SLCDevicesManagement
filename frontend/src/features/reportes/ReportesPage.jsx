import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import '@/features/reportes/reportes.css';
import { matchesSearch } from '@/shared/utils/search';

const INFORMES = [
  {
    id: 'inventario-general',
    titulo: 'Inventario general',
    descripcion: 'Totales por empresa: disponibles, asignados, mantenimiento, baja y costo.',
    to: '/app',
  },
  {
    id: 'activos-por-sede',
    titulo: 'Activos por sede',
    descripcion: 'Parque agregado por sede de la empresa activa.',
    to: '/app',
  },
  {
    id: 'activos-por-ubicacion',
    titulo: 'Activos por ubicación',
    descripcion: 'Mismo recuento, agrupado por sitio físico.',
    to: '/app',
  },
  {
    id: 'activos-por-categoria',
    titulo: 'Activos por categoría',
    descripcion: 'Distribución del parque por categoría de activo.',
    to: '/app',
  },
  {
    id: 'activos-por-responsable',
    titulo: 'Activos por responsable',
    descripcion: 'Asignaciones vigentes agrupadas por responsable.',
    to: '/app',
  },
  {
    id: 'activos',
    titulo: 'Activos detallados',
    descripcion: 'Listado paginado con filtros de estado, sede, categoría y responsable.',
    to: '/app/reportes/activos',
  },
  {
    id: 'garantias-por-vencer',
    titulo: 'Garantías por vencer',
    descripcion: 'Activos cuya garantía vence en 30, 60 o 90 días.',
    to: '/app',
  },
  {
    id: 'diferencias-inventario',
    titulo: 'Diferencias de inventario',
    descripcion: 'Solo jornadas cerradas. Faltante, no encontrado y mal estado.',
    to: '/app',
  },
];

function PdfMark() {
  return (
    <svg className="report-pdf" viewBox="0 0 72 92" aria-hidden>
      <path
        className="report-pdf-page"
        d="M10 6c0-2.2 1.8-4 4-4h32.2L66 21.8V82c0 2.2-1.8 4-4 4H14c-2.2 0-4-1.8-4-4V6z"
      />
      <path className="report-pdf-fold-face" d="M46.2 2v15.2c0 2.4 1.9 4.4 4.4 4.4H66L46.2 2z" />
      <path className="report-pdf-fold-edge" d="M46.2 2v15.2c0 2.4 1.9 4.4 4.4 4.4" fill="none" />
      <path className="report-pdf-line" d="M20 28h22" />
      <path className="report-pdf-line" d="M20 35h32" />
      <path className="report-pdf-line" d="M20 42h28" />
      <rect className="report-pdf-badge" x="14" y="56" width="44" height="20" rx="4" />
      <text className="report-pdf-text" x="36" y="70.5" textAnchor="middle">
        PDF
      </text>
    </svg>
  );
}

export function ReportesPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid');

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) return INFORMES;
    return INFORMES.filter((item) => matchesSearch(`${item.titulo} ${item.descripcion}`, needle));
  }, [query]);

  return (
    <section className="report-page">
      <header className="report-head">
        <div className="report-head-copy">
          <h2 className="report-title">
            <i className="pi pi-chart-bar" aria-hidden />
            Reportes
          </h2>
          <p className="report-lead">Ocho informes operativos sobre `/api/Reportes`.</p>
        </div>

        <div className="report-toolbar">
          <div className="report-view" role="group" aria-label="Vista">
            <button
              type="button"
              className={view === 'grid' ? 'is-on' : undefined}
              aria-pressed={view === 'grid'}
              aria-label="Vista de cuadrícula"
              onClick={() => setView('grid')}
            >
              <i className="pi pi-th-large" aria-hidden />
            </button>
            <button
              type="button"
              className={view === 'list' ? 'is-on' : undefined}
              aria-pressed={view === 'list'}
              aria-label="Vista de lista"
              onClick={() => setView('list')}
            >
              <i className="pi pi-bars" aria-hidden />
            </button>
          </div>
          <div className="report-search">
            <label className="report-sr" htmlFor="report-search">
              Buscar reportes
            </label>
            <i className="pi pi-search" aria-hidden />
            <input
              id="report-search"
              type="search"
              value={query}
              placeholder="Buscar reportes..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <p className="report-empty">Ningún informe coincide con la búsqueda.</p>
      ) : (
        <ul className={`report-grid${view === 'list' ? ' is-list' : ''}`}>
          {filtered.map((item) => (
            <li key={item.id} className={`report-card${view === 'list' ? ' is-list' : ''}`}>
              <Link to={item.to} className="report-card-body">
                <PdfMark />
                <span className="report-card-copy">
                  <span className="report-card-title">{item.titulo}</span>
                  <span className="report-card-desc">{item.descripcion}</span>
                </span>
              </Link>
              <div className="report-card-foot">
                <Link to={item.to} className="report-open">
                  <i className="pi pi-file" aria-hidden />
                  Abrir informe
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
