export const catalogos = [
  { slug: 'empresas', label: 'Empresas' },
  { slug: 'sedes', label: 'Sedes' },
  { slug: 'areas', label: 'Áreas' },
  { slug: 'categorias', label: 'Categorías' },
  { slug: 'proveedores', label: 'Proveedores' },
  { slug: 'ubicaciones', label: 'Ubicaciones' },
  { slug: 'paises', label: 'Países' },
];

export const modulosApp = [
  { path: '/app/activos', label: 'Activos', icon: 'pi pi-box' },
  { path: '/app/asignaciones', label: 'Asignaciones', icon: 'pi pi-users' },
  { path: '/app/traslados', label: 'Traslados', icon: 'pi pi-arrow-right-arrow-left' },
  { path: '/app/mantenimientos', label: 'Mantenimientos', icon: 'pi pi-wrench' },
  { path: '/app/bajas', label: 'Bajas', icon: 'pi pi-times-circle' },
  { path: '/app/inventario-fisico', label: 'Inventario físico', icon: 'pi pi-clipboard' },
  { path: '/app/bitacora', label: 'Bitácora', icon: 'pi pi-history' },
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
    })),
  },
  ...modulosApp.map((item) => ({ type: 'link', ...item })),
];

const catalogTitles = Object.fromEntries(
  catalogos.map((item) => [`/app/catalogos/${item.slug}`, item.label]),
);

const moduloTitles = Object.fromEntries(modulosApp.map((item) => [item.path, item.label]));

export const pageTitles = {
  '/app': 'Panel',
  ...catalogTitles,
  ...moduloTitles,
};

export function getPageTitle(pathname) {
  return pageTitles[pathname] ?? 'SLCDM';
}
