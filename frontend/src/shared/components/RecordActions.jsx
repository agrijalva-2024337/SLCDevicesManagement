import { Link } from 'react-router';

const viewClass = 'app-btn app-btn--ghost app-btn--sm';
const editClass = 'app-btn app-btn--primary app-btn--sm';

export function RecordActions({ viewTo, editTo, onView, onEdit }) {
  const showView = Boolean(viewTo || onView);
  const showEdit = Boolean(editTo || onEdit);

  return (
    <>
      {showView ? (
        viewTo ? (
          <Link to={viewTo} className={viewClass}>
            Ver ficha
          </Link>
        ) : (
          <button type="button" className={viewClass} onClick={onView}>
            Ver ficha
          </button>
        )
      ) : null}
      {showEdit ? (
        editTo ? (
          <Link to={editTo} className={editClass}>
            Editar registro
          </Link>
        ) : (
          <button type="button" className={editClass} onClick={onEdit}>
            Editar registro
          </button>
        )
      ) : null}
    </>
  );
}

export function EditRecordButton({ to, onClick }) {
  if (to) {
    return (
      <Link to={to} className="app-btn app-btn--primary">
        Editar registro
      </Link>
    );
  }

  return (
    <button type="button" className="app-btn app-btn--primary" onClick={onClick}>
      Editar registro
    </button>
  );
}

export function DescargarActaButton({ url }) {
  if (!url) return null;
  return (
    <a className="app-btn app-btn--ghost" href={url} download target="_blank" rel="noreferrer">
      <i className="pi pi-download" aria-hidden="true" />
      Descargar acta en PDF
    </a>
  );
}

export function EscanearQrButton({ label = 'Escanear QR' }) {
  return (
    <Link to="/app/escanear" className="app-btn app-btn--ghost">
      <i className="pi pi-qrcode" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function RegisterButton({ to, onClick, label }) {
  if (to) {
    return (
      <Link to={to} className="app-btn app-btn--primary">
        <i className="pi pi-plus" aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className="app-btn app-btn--primary" onClick={onClick}>
      <i className="pi pi-plus" aria-hidden="true" />
      {label}
    </button>
  );
}
