export const EMPRESA_ACTIVA_STORAGE_KEY = 'slcdm_empresa_activa';

/** Limpia la empresa activa persistida (p. ej. al cerrar sesión). */
export function clearEmpresaActivaStorage() {
  window.localStorage.removeItem(EMPRESA_ACTIVA_STORAGE_KEY);
}
