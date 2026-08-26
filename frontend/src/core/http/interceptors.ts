import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from './tokenStorage';

export function attachAuthInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Auth (sprint posterior): si 401, clearAccessToken() y redirigir a login.
      return Promise.reject(error);
    },
  );
}
