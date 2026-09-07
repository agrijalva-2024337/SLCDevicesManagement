export const ACTIVOS_VISTA_DEFAULT = 'activos';

export const ACTIVOS_VISTAS = [
  { id: 'activos', label: 'Activos', icon: 'pi pi-box' },
  { id: 'asignaciones', label: 'Asignaciones', icon: 'pi pi-users' },
  { id: 'traslados', label: 'Traslados', icon: 'pi pi-arrow-right-arrow-left' },
  { id: 'mantenimientos', label: 'Mantenimientos', icon: 'pi pi-wrench' },
  { id: 'bajas', label: 'Bajas', icon: 'pi pi-times-circle' },
];

export function resolveActivosVista(value) {
  return ACTIVOS_VISTAS.some((item) => item.id === value) ? value : ACTIVOS_VISTA_DEFAULT;
}

export function titleForActivosVista(value) {
  const id = resolveActivosVista(value);
  return ACTIVOS_VISTAS.find((item) => item.id === id)?.label ?? 'Activos';
}

export function activosVistaPath(vista, extra = {}) {
  const params = new URLSearchParams();
  Object.entries(extra).forEach(([key, value]) => {
    if (value != null && value !== '') params.set(key, String(value));
  });
  const resolved = resolveActivosVista(vista);
  if (resolved !== ACTIVOS_VISTA_DEFAULT) params.set('vista', resolved);
  else params.delete('vista');
  const query = params.toString();
  return query ? `/app/activos?${query}` : '/app/activos';
}

export function vistaFromLegacyPath(pathname) {
  if (pathname.startsWith('/app/asignaciones')) return 'asignaciones';
  if (pathname.startsWith('/app/traslados')) return 'traslados';
  if (pathname.startsWith('/app/mantenimientos')) return 'mantenimientos';
  if (pathname.startsWith('/app/bajas')) return 'bajas';
  return null;
}
