import { useState } from 'react';
import { Link } from 'react-router';
import { AtmosphereBackdrop } from '@/features/landing/components/AtmosphereBackdrop';
import { TypeLine } from '@/features/landing/components/TypeLine';
import '@/features/landing/landing.css';

export function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    // [API] POST de autenticación; validar token y perfil en <RutaProtegida>
  }

  return (
    <main className="landing-auth">
      <AtmosphereBackdrop />

      <div className="landing-auth-panel">
        <p className="landing-auth-kicker">SLCDM</p>
        <h1 className="landing-auth-title">
          <TypeLine text="Iniciar sesión" ms={32} />
        </h1>
        <p className="landing-auth-lead">
          Acceso al inventario de activos de Sistemas Logísticos y Corporativos, S.A.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="correo" className="app-label">
              Correo institucional
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className="app-input"
            />
          </div>

          <div>
            <label htmlFor="clave" className="app-label">
              Contraseña
            </label>
            <div className="app-input-password">
              <input
                id="clave"
                type={mostrarClave ? 'text' : 'password'}
                autoComplete="current-password"
                value={clave}
                onChange={(event) => setClave(event.target.value)}
                className="app-input"
              />
              <button
                type="button"
                className="app-icon-btn"
                aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarClave}
                onClick={() => setMostrarClave((open) => !open)}
              >
                <i className={mostrarClave ? 'pi pi-eye-slash' : 'pi pi-eye'} aria-hidden="true" />
              </button>
            </div>
          </div>

          <button type="submit" className="app-btn app-btn--primary w-full landing-auth-submit">
            Iniciar sesión
          </button>
        </form>

        <p className="landing-auth-back">
          <Link to="/">Volver a la pantalla de inicio</Link>
        </p>
      </div>
    </main>
  );
}
