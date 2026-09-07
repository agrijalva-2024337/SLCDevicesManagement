import { Link } from 'react-router';
import '@/features/consulta/consulta.css';

export function ConsultaShell({ children }) {
  return (
    <div className="consulta-page">
      <header className="consulta-topbar">
        <div className="consulta-shell consulta-topbar-inner">
          <div>
            <p className="consulta-brand-kicker">SLCDM</p>
            <p className="consulta-brand-name">Consulta de activos</p>
          </div>
          <div className="consulta-topbar-actions">
            <Link to="/escanear" className="app-btn app-btn--primary app-btn--sm">
              <i className="pi pi-qrcode" aria-hidden="true" />
              Escanear QR
            </Link>
            <Link to="/login" className="app-btn app-btn--ghost app-btn--sm">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="consulta-main">
        <div className="consulta-shell">{children}</div>
      </main>

      <footer className="consulta-footer">Sistemas Logísticos y Corporativos, S.A.</footer>
    </div>
  );
}
