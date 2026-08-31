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

function persistSession(session) {
  setAccessToken(session.accessToken);
  setSessionUser(session.usuario);
  return session;
}

export async function login({ correo, clave }) {
  if (env.useApiMock) {
    await wait(MOCK_DELAY_MS);
    const usuario = usuariosSesion.find(
      (item) =>
        item.correo.toLowerCase() ===
        String(correo ?? '')
          .trim()
          .toLowerCase(),
    );

    if (!usuario || clave !== DEMO_PASSWORD || !usuario.habilitado) {
      const error = new Error('Correo o contraseña incorrectos.');
      error.status = 401;
      throw error;
    }

    return persistSession({
      accessToken: `mock-jwt-${usuario.id}`,
      expiresIn: 3600,
      usuario,
    });
  }

  const response = await httpClient.post(apiPaths.auth.login, { correo, clave });
  return persistSession(response.data);
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
  setSessionUser(response.data);
  return response.data;
}

export function logout() {
  clearAccessToken();
}
