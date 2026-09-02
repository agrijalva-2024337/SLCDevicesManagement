import { Link } from 'react-router';

const viewClass = 'app-btn app-btn--ghost app-btn--sm';
const editClass = 'app-btn app-btn--primary app-btn--sm';

export function RecordActions({ viewTo, editTo, onView, onEdit }) {
  return (
    <>
      {viewTo ? (
        <Link to={viewTo} className={viewClass}>
          Ver ficha
        </Link>
      ) : (
        <button type="button" className={viewClass} onClick={onView}>
          Ver ficha
        </button>
      )}
      {editTo ? (
        <Link to={editTo} className={editClass}>
          Editar registro
        </Link>
      ) : (
        <button type="button" className={editClass} onClick={onEdit}>
          Editar registro
        </button>
      )}
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
