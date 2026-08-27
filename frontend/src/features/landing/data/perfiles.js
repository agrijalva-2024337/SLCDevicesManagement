export const perfilesIntro = {
  kicker: 'Gobierno de acceso',
  titulo: 'Perfiles de usuario',
  descripcion:
    'Niveles de acceso granulares para el resguardo de la información corporativa, con responsabilidades claras en cada organización.',
};

export const perfiles = [
  {
    id: 'administrador-general',
    nombre: 'Administrador General',
    descripcion: 'Control total multiempresa y auditorías de inventario global.',
    icono: 'pi pi-shield',
  },
  {
    id: 'administrador-empresa',
    nombre: 'Administrador de Empresa',
    descripcion: 'Gestión exclusiva de activos y operadores de su organización.',
    icono: 'pi pi-building',
  },
  {
    id: 'operador-inventario',
    nombre: 'Operador de Inventario',
    descripcion: 'Registro de asignaciones, traslados, mantenimientos y conteos físicos.',
    icono: 'pi pi-box',
  },
  {
    id: 'consulta',
    nombre: 'Consulta',
    descripcion: 'Acceso de solo lectura a reportes e historiales autorizados.',
    icono: 'pi pi-eye',
  },
];
