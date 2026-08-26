export function getErrorMessage(error) {
  if (!error) {
    return 'Ocurrió un error al procesar la solicitud.';
  }

  if (error.response) {
    const apiMessage = error.response.data?.message || error.response.data?.title;
    return apiMessage || `La API respondió con HTTP ${error.response.status}.`;
  }

  if (error.request) {
    return 'No se pudo conectar con la API. Verifica VITE_API_URL y que el backend esté en ejecución.';
  }

  return error.message || 'Error inesperado.';
}
