import { Link, useSearchParams } from 'react-router';
import { ACTIVOS_VISTAS, activosVistaPath, resolveActivosVista } from '@/features/activos/activosVistas';

export function ActivosVistaNav() {
  const [params] = useSearchParams();
  const activa = resolveActivosVista(params.get('vista'));

  return (
    <nav className="app-vista-nav" aria-label="Vistas del parque">
      {ACTIVOS_VISTAS.map((item) => {
        const isActive = item.id === activa;
        return (
          <Link
            key={item.id}
            to={activosVistaPath(item.id)}
            className={`app-vista-nav__tab ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <i className={item.icon} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
