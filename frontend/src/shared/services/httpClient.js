import axios from 'axios';
import { getApiErrorMessage, getValidationErrors } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { clearAccessToken, getAccessToken } from '@/shared/services/tokenStorage';

const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function isLoginRequest(config) {
  const url = String(config?.url ?? '');
  return url.includes('/auth/login');
}

function redirectToLogin() {
  const path = window.location.pathname;
  if (path === '/login' || path.startsWith('/login/')) {
    return;
  }
  window.location.assign('/login');
}

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (!isLoginRequest(error.config)) {
        clearAccessToken();
        redirectToLogin();
      }
      error.message = getApiErrorMessage(error);
      return Promise.reject(error);
    }

    if (status === 403) {
      error.message = 'No tenés permiso para esta acción.';
      return Promise.reject(error);
    }

    if (status === 429) {
      error.message = 'Demasiadas solicitudes, intentá en unos segundos.';
      return Promise.reject(error);
    }

    if (status === 400) {
      error.fieldErrors = getValidationErrors(error);
      error.message = getApiErrorMessage(error);
      return Promise.reject(error);
    }

    error.message = getApiErrorMessage(error);
    return Promise.reject(error);
  },
);

export default httpClient;
