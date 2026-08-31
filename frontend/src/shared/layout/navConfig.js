export const MOCK_EMPRESAS_ACTIVAS = [
  { id: 1, nombre: 'Sistemas Logísticos y Corporativos, S.A.' },
  { id: 2, nombre: 'SLC Servicios Logísticos' },
  { id: 3, nombre: 'DERCAS Operaciones' },
];

export const NAV_SECTIONS = [
  {
    id: 'inicio',
    label: 'Inicio',
    items: [{ to: '/', label: 'Dashboard', end: true }],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    items: [
      { to: '/catalogos/empresas', label: 'Empresas' },
      { to: '/catalogos/sedes', label: 'Sedes' },
      { to: '/catalogos/areas', label: 'Áreas' },
      { to: '/catalogos/categorias', label: 'Categorías' },
      { to: '/catalogos/proveedores', label: 'Proveedores' },
      { to: '/catalogos/ubicaciones', label: 'Ubicaciones' },
    ],
  },
  {
    id: 'activos',
    label: 'Activos',
    items: [{ label: 'Activos', disabled: true }],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    items: [
      { label: 'Asignaciones', disabled: true },
      { label: 'Traslados', disabled: true },
      { label: 'Mantenimientos', disabled: true },
      { label: 'Bajas', disabled: true },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    items: [{ label: 'Inventario', disabled: true }],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    items: [{ label: 'Reportes', disabled: true }],
  },
];
