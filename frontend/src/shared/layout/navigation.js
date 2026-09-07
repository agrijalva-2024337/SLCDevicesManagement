import { titleForActivosVista } from '@/features/activos/activosVistas';

export const catalogos = [
  { slug: 'empresas', label: 'Empresas', icon: 'pi pi-building' },
  { slug: 'sedes', label: 'Sedes', icon: 'pi pi-map-marker' },
  { slug: 'areas', label: 'Áreas', icon: 'pi pi-th-large' },
  { slug: 'categorias', label: 'Categorías', icon: 'pi pi-tags' },
  { slug: 'proveedores', label: 'Proveedores', icon: 'pi pi-truck' },
  { slug: 'ubicaciones', label: 'Ubicaciones', icon: 'pi pi-map' },
  { slug: 'paises', label: 'Países', icon: 'pi pi-globe' },
];

export const modulosApp = [
  { path: '/app/activos', label: 'Activos', icon: 'pi pi-box' },
  { path: '/app/inventario-fisico', label: 'Inventario físico', icon: 'pi pi-clipboard' },
  { path: '/app/bitacora', label: 'Bitácora', icon: 'pi pi-history', adminOnly: true },
  { path: '/app/reportes', label: 'Reportes', icon: 'pi pi-chart-bar' },
];

export const navigation = [
  { type: 'link', path: '/app', label: 'Inicio', icon: 'pi pi-home' },
  {
    type: 'group',
    label: 'Catálogos',
    icon: 'pi pi-book',
    children: catalogos.map((item) => ({
      path: `/app/catalogos/${item.slug}`,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
    })),
  },
  ...modulosApp.map((item) => ({ type: 'link', ...item })),
];

const catalogTitles = Object.fromEntries(
  catalogos.map((item) => [`/app/catalogos/${item.slug}`, item.label]),
);

const moduloTitles = Object.fromEntries(modulosApp.map((item) => [item.path, item.label]));

export const pageTitles = {
  '/app': 'Principal',
  ...catalogTitles,
  ...moduloTitles,
};

export function getPageTitle(pathname, search = '') {
  if (pathname === '/app/activos' || pathname.startsWith('/app/activos')) {
    return titleForActivosVista(new URLSearchParams(search).get('vista'));
  }
  if (pathname.startsWith('/app/asignaciones')) return 'Asignaciones';
  if (pathname.startsWith('/app/traslados')) return 'Traslados';
  if (pathname.startsWith('/app/mantenimientos')) return 'Mantenimientos';
  if (pathname.startsWith('/app/bajas')) return 'Bajas';
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  if (/^\/app\/catalogos\/empresas\/nueva/.test(pathname)) {
    return 'Registrar empresa';
  }
  if (/^\/app\/catalogos\/empresas\/\d+\/editar/.test(pathname)) {
    return 'Editar empresa';
  }
  if (/^\/app\/catalogos\/empresas\/\d+/.test(pathname)) {
    return 'Empresa';
  }
  if (/^\/app\/catalogos\/sedes\/nueva/.test(pathname)) {
    return 'Registrar sede';
  }
  if (/^\/app\/catalogos\/sedes\/\d+\/editar/.test(pathname)) {
    return 'Editar sede';
  }
  if (/^\/app\/catalogos\/sedes\/\d+/.test(pathname)) {
    return 'Sede';
  }
  if (/^\/app\/catalogos\/[^/]+\/nueva/.test(pathname)) {
    return 'Registrar';
  }
  if (/^\/app\/catalogos\/[^/]+\/[^/]+\/editar/.test(pathname)) {
    return 'Editar registro';
  }
  if (/^\/app\/catalogos\/[^/]+\/[^/]+/.test(pathname)) {
    return 'Ficha';
  }
  if (/^\/app\/inventario-fisico\/\d+/.test(pathname)) {
    return 'Jornada';
  }
  if (/^\/app\/reportes\/activos/.test(pathname)) {
    return 'Activos detallados';
  }
  return 'SLCDM';
}

export function getPageKicker(pathname) {
  if (pathname === '/app') return 'Panel';
  if (pathname.startsWith('/app/catalogos')) return 'Catálogo';
  if (
    pathname.startsWith('/app/activos') ||
    pathname.startsWith('/app/asignaciones') ||
    pathname.startsWith('/app/traslados') ||
    pathname.startsWith('/app/mantenimientos') ||
    pathname.startsWith('/app/bajas') ||
    pathname.startsWith('/app/inventario-fisico')
  ) {
    return 'Inventario';
  }
  if (pathname.startsWith('/app/bitacora')) return 'Auditoría';
  if (pathname.startsWith('/app/reportes')) return 'Informes';
  return 'SLCDM';
}
