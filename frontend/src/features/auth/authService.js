import { DEMO_PASSWORD, usuariosSesion } from '@/features/auth/mocks/usuariosSesion';
import { apiPaths } from '@/shared/api/paths';
import { env } from '@/shared/config/env';
import httpClient from '@/shared/services/httpClient';
import {
  clearAccessToken,
  getAccessToken,
  getSessionUser,
  setAccessToken,
  setSessionUser,
} from '@/shared/services/tokenStorage';

const MOCK_DELAY_MS = 400;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function mapAuthenticatedUser(details) {
  if (!details) {
    return null;
  }

  return {
    id: details.id,
    idEmpresa: details.idEmpresa ?? null,
    nombres: details.nombre ?? details.nombres ?? '',
    correo: details.email ?? details.correo ?? '',
    username: details.username,
    rol: details.rol,
    role: details.role,
    habilitado: details.habilitado !== false,
  };
}

function persistSession({ token, expiresAt, usuario }) {
  setAccessToken(token);
  setSessionUser(usuario);
  return { token, expiresAt, usuario };
}

export async function login(credentials) {
  const emailOrUsername = String(credentials.emailOrUsername ?? credentials.correo ?? '').trim();
  const password = String(credentials.password ?? credentials.clave ?? '');

  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);
    const usuario = usuariosSesion.find(
      (item) => item.correo.toLowerCase() === emailOrUsername.toLowerCase(),
    );

    if (!usuario || password !== DEMO_PASSWORD || !usuario.habilitado) {
      const error = new Error('Correo o contraseña incorrectos.');
      error.status = 401;
      throw error;
    }

    return persistSession({
      token: `mock-jwt-${usuario.id}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      usuario,
    });
  }

  const response = await httpClient.post(apiPaths.auth.login, { emailOrUsername, password });
  const data = response.data;
  return persistSession({
    token: data.token,
    expiresAt: data.expiresAt,
    usuario: mapAuthenticatedUser(data.userDetails),
  });
}

export async function getMe() {
  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);
    const usuario = getSessionUser();

    if (!usuario || !getAccessToken()) {
      const error = new Error('No hay una sesión activa.');
      error.status = 401;
      throw error;
    }

    return usuario;
  }

  const response = await httpClient.get(apiPaths.auth.me);
  const usuario = mapAuthenticatedUser(response.data);
  setSessionUser(usuario);
  return usuario;
}

export function logout() {
  clearAccessToken();
}
