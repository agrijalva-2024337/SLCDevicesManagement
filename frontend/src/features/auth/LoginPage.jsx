import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { AtmosphereBackdrop } from '@/features/landing/components/AtmosphereBackdrop';
import { TypeLine } from '@/features/landing/components/TypeLine';
import { getValidationErrors } from '@/shared/api/errors';
import { enforceRequired } from '@/shared/utils/fieldErrors';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import '@/features/landing/landing.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const nextErrors = {};
    enforceRequired(nextErrors, { correo, clave }, 'correo', 'correo o usuario');
    enforceRequired(nextErrors, { correo, clave }, 'clave', 'contraseña');
    setFieldErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await login({ emailOrUsername: correo, password: clave });
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/') ? from : '/app', { replace: true });
    } catch (error) {
      const apiFields = getValidationErrors(error);
      if (Object.keys(apiFields).length > 0) {
        setFieldErrors({
          correo: apiFields.emailOrUsername ?? apiFields.correo,
          clave: apiFields.password ?? apiFields.clave,
        });
      }
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
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

        {formError ? (
          <div className="app-feedback app-feedback--error mt-6" role="alert">
            {formError}
          </div>
        ) : null}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="correo" className="app-label">
              Correo o usuario
            </label>
            <input
              id="correo"
              type="text"
              autoComplete="username"
              value={correo}
              onChange={(event) => {
                setCorreo(event.target.value);
                setFieldErrors((current) => ({ ...current, correo: undefined }));
              }}
              className={fieldErrors.correo ? 'app-input app-input--error' : 'app-input'}
            />
            {fieldErrors.correo ? <p className="app-field-error">{fieldErrors.correo}</p> : null}
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
                onChange={(event) => {
                  setClave(event.target.value);
                  setFieldErrors((current) => ({ ...current, clave: undefined }));
                }}
                className={fieldErrors.clave ? 'app-input app-input--error' : 'app-input'}
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
            {fieldErrors.clave ? <p className="app-field-error">{fieldErrors.clave}</p> : null}
          </div>

          <button
            type="submit"
            className="app-btn app-btn--primary w-full landing-auth-submit"
            disabled={saving}
          >
            {saving ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="landing-auth-back">
          <Link to="/">Volver a la pantalla de inicio</Link>
        </p>
      </div>
    </main>
  );
}
