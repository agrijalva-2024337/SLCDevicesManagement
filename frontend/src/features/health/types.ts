export type HealthStatus = {
  status: 'ok' | 'error';
  source: 'api' | 'mock';
  message: string;
};
