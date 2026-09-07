import { activos } from '@/features/activos/mocks/activos';
import { ESTADO_OPERATIVO } from '@/shared/api/contracts';

function byId(id) {
  return activos.find((item) => item.id === id);
}

export const activosReporte = [
  {
    activo: byId(1),
    estadoOperativo: ESTADO_OPERATIVO.Asignado,
    idSede: 3,
    nombreSede: 'Oficina Central Reforma',
    idResponsable: 1,
    idEmpresa: 1,
    idCategoriaActivo: 1,
  },
  {
    activo: byId(2),
    estadoOperativo: ESTADO_OPERATIVO.Disponible,
    idSede: 3,
    nombreSede: 'Oficina Central Reforma',
    idResponsable: null,
    idEmpresa: 1,
    idCategoriaActivo: 6,
  },
  {
    activo: byId(3),
    estadoOperativo: ESTADO_OPERATIVO.Disponible,
    idSede: 5,
    nombreSede: 'Patio Mixco Norte',
    idResponsable: null,
    idEmpresa: 5,
    idCategoriaActivo: 9,
  },
  {
    activo: byId(4),
    estadoOperativo: ESTADO_OPERATIVO.Mantenimiento,
    idSede: 5,
    nombreSede: 'Patio Mixco Norte',
    idResponsable: null,
    idEmpresa: 5,
    idCategoriaActivo: 11,
  },
  {
    activo: byId(5),
    estadoOperativo: ESTADO_OPERATIVO.Baja,
    idSede: 1,
    nombreSede: 'Centro de Distribución Zona 12',
    idResponsable: null,
    idEmpresa: 1,
    idCategoriaActivo: 1,
  },
];
