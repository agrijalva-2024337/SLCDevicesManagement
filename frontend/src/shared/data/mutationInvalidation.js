import { invalidateQueries } from '@/shared/data/queryCache';

const MUTATION_INVALIDATIONS = {
  paises: [['paises']],
  empresas: [['empresas'], ['sedes']],
  sedes: [['sedes'], ['ubicaciones']],
  areas: [['areas'], ['responsables']],
  usuarios: [['usuarios']],
  responsables: [['responsables']],
  estados: [['estados']],
  tiposAsignacion: [['tiposAsignacion']],
  categoriasActivo: [['categoriasActivo']],
  proveedores: [['proveedores']],
  ubicaciones: [['ubicaciones'], ['redesConocidas']],
  redesConocidas: [['redesConocidas']],
  activos: [['activos'], ['reportes']],
  asignaciones: [['asignaciones'], ['activos'], ['historialActivos'], ['reportes']],
  historialActivos: [['historialActivos']],
  historicosInventario: [['historicosInventario'], ['reportes'], ['detallesActivo']],
  detallesActivo: [['detallesActivo'], ['historicosInventario'], ['reportes']],
  motivosBaja: [['motivosBaja']],
  tiposMantenimiento: [['tiposMantenimiento']],
};

export function invalidateAfterMutation(resource) {
  const prefixes = MUTATION_INVALIDATIONS[resource] ?? [[resource]];
  for (const prefix of prefixes) {
    invalidateQueries(prefix);
  }
}
