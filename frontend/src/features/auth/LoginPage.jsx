import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';

export function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    // [API] POST de autenticación; validar token y perfil en <RutaProtegida>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-navy to-navy-mid px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border-on-dark bg-surface-card p-8 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">SLCDM</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Acceso al inventario de activos de Sistemas Logísticos y Corporativos, S.A.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="correo" className="text-sm font-medium text-navy">
              Correo institucional
            </label>
            <InputText
              id="correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="clave" className="text-sm font-medium text-navy">
              Contraseña
            </label>
            <Password
              inputId="clave"
              value={clave}
              onChange={(event) => setClave(event.target.value)}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          <Button type="submit" label="Iniciar sesión" className="w-full" />
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          <Link to="/" className="font-medium text-accent-text hover:underline">
            Volver a la pantalla de inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
