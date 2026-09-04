using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.HistoricosInventario;

internal static class InventarioJornadaRules
{
    public static async Task<List<int>> IdsActivosEsperadosAsync(
        IApplicationDbContext db, int idSede, CancellationToken cancellationToken)
    {
        var idsUbicacionesDeLaSede = await db.Ubicaciones.AsNoTracking()
            .Where(u => u.IdSede == idSede).Select(u => u.Id).ToListAsync(cancellationToken);

        if (idsUbicacionesDeLaSede.Count == 0) return [];

        var idsActivos = await db.Activos.AsNoTracking()
            .Where(a => a.IdUbicacion.HasValue && idsUbicacionesDeLaSede.Contains(a.IdUbicacion.Value))
            .Select(a => a.Id).ToListAsync(cancellationToken);

        var idsDadosDeBaja = await ActivoBajaRules.IdsDadosDeBajaAsync(db, cancellationToken);
        return idsActivos.Where(id => !idsDadosDeBaja.Contains(id)).ToList();
    }
}