function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa frontend/.env`);
  }

  return value;
}

export const env = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;
