export const catalogos = [
  { slug: 'empresas', label: 'Empresas', icon: 'pi pi-building' },
  { slug: 'sedes', label: 'Sedes' },
  { slug: 'areas', label: 'Áreas' },
  { slug: 'categorias', label: 'Categorías' },
  { slug: 'proveedores', label: 'Proveedores' },
  { slug: 'ubicaciones', label: 'Ubicaciones' },
  { slug: 'paises', label: 'Países' },
];

export const modulosApp = [
  { path: '/app/activos', label: 'Activos', icon: 'pi pi-box', disabled: true },
  { path: '/app/asignaciones', label: 'Asignaciones', icon: 'pi pi-users', disabled: true },
  { path: '/app/traslados', label: 'Traslados', icon: 'pi pi-arrow-right-arrow-left', disabled: true },
  { path: '/app/mantenimientos', label: 'Mantenimientos', icon: 'pi pi-wrench', disabled: true },
  { path: '/app/bajas', label: 'Bajas', icon: 'pi pi-times-circle', disabled: true },
  { path: '/app/inventario-fisico', label: 'Inventario físico', icon: 'pi pi-clipboard', disabled: true },
  { path: '/app/bitacora', label: 'Bitácora', icon: 'pi pi-history', disabled: true },
  { path: '/app/reportes', label: 'Reportes', icon: 'pi pi-chart-bar', disabled: true },
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

export function getPageTitle(pathname) {
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
  return 'SLCDM';
}

export function getPageKicker(pathname) {
  if (pathname === '/app') return 'Panel';
  if (pathname.startsWith('/app/catalogos')) return 'Catálogo';
  if (
    pathname.startsWith('/app/activos') ||
    pathname.startsWith('/app/asignaciones') ||
    pathname.startsWith('/app/traslados') ||
    pathname.startsWith('/app/inventario-fisico')
  ) {
    return 'Inventario';
  }
  if (pathname.startsWith('/app/mantenimientos') || pathname.startsWith('/app/bajas')) {
    return 'Operaciones';
  }
  if (pathname.startsWith('/app/bitacora')) return 'Auditoría';
  if (pathname.startsWith('/app/reportes')) return 'Informes';
  return 'SLCDM';
}
