import { empresas } from '@/features/organizacion/mocks/empresas';

const BASE = [
  { nombre: 'Disponible', descripcion: 'Activo libre para asignar.' },
  { nombre: 'Asignado', descripcion: 'Activo en uso por un responsable.' },
  { nombre: 'En mantenimiento', descripcion: 'Fuera de operación temporalmente.' },
  { nombre: 'Dado de baja', descripcion: 'Ya no forma parte del inventario activo.' },
];

/** Catálogo de estados por empresa (ids 1–4 = empresa 1, luego clones). */
export const estados = empresas.flatMap((empresa, empresaIndex) =>
  BASE.map((row, i) => ({
    id: empresaIndex * BASE.length + i + 1,
    idEmpresa: empresa.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
  })),
);
