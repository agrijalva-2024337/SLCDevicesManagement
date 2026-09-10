import { empresas } from '@/features/organizacion/mocks/empresas';

const BASE = [
  { nombre: 'Asignacion', descripcion: 'Entrega de un activo a un responsable' },
  {
    nombre: 'Traslado',
    descripcion: 'Movimiento de un activo entre ubicaciones de la misma empresa',
  },
  {
    nombre: 'Mantenimiento',
    descripcion: 'Mantenimiento preventivo o correctivo de un activo',
  },
  { nombre: 'Baja', descripcion: 'Baja definitiva de un activo' },
];

/** Tipos de asignación por empresa (ids 1–4 = empresa 1, luego clones). */
export const tiposAsignacion = empresas.flatMap((empresa, empresaIndex) =>
  BASE.map((row, i) => ({
    id: empresaIndex * BASE.length + i + 1,
    idEmpresa: empresa.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
  })),
);
