import axios from 'axios';
import { env } from '../config/env';
import { attachAuthInterceptor } from './interceptors';
import { mockAdapter } from './mockAdapter';

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

attachAuthInterceptor(httpClient);

if (env.useMock) {
  httpClient.defaults.adapter = mockAdapter;
}
