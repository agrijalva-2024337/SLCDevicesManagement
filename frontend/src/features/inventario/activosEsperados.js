import { isActivoDeBaja } from '@/features/activos/activoAcciones';
import * as activoService from '@/features/activos/activoService';
import * as asignacionService from '@/features/asignaciones/asignacionService';
import * as ubicacionService from '@/features/catalogos/ubicaciones/ubicacionService';
import * as tipoAsignacionService from '@/features/organizacion/tiposAsignacion/tipoAsignacionService';
import { nombreUbicacion } from '@/features/inventario/trasladoRuta';

// [API] Pedir GET /api/HistoricosInventario/{id}/esperados. Mientras tanto se replica
// InventarioJornadaRules en el cliente: ubicaciones de la sede → activos con esa
// idUbicacion → excluir dados de baja.

export async function listarAgrupadosPorUbicacion(idSede) {
  const [ubicaciones, activos, asignaciones, tipos] = await Promise.all([
    ubicacionService.getAll(),
    activoService.getAll(),
    asignacionService.getAll(),
    tipoAsignacionService.getAll(),
  ]);
  const ctx = { asignaciones, tipos };
  const deSede = (ubicaciones ?? []).filter((item) => Number(item.idSede) === Number(idSede));

  return deSede
    .map((ubicacion) => ({
      ubicacion,
      nombreUbicacion: nombreUbicacion(ubicacion),
      activos: (activos ?? []).filter(
        (activo) =>
          Number(activo.idUbicacion) === Number(ubicacion.id) && !isActivoDeBaja(activo, ctx),
      ),
    }))
    .filter((grupo) => grupo.activos.length > 0);
}

export async function idsEsperadosDeSede(idSede) {
  const grupos = await listarAgrupadosPorUbicacion(idSede);
  return grupos.flatMap((grupo) => grupo.activos.map((activo) => Number(activo.id)));
}
