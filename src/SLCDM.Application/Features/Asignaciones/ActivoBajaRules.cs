using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones;

internal static class ActivoBajaRules
{
    public const string MensajeActivoDadoDeBaja =
        "El activo esta dado de baja. No puede asignarse, trasladarse ni enviarse a mantenimiento.";

    public static async Task<bool> EstaDadoDeBajaAsync(
        IApplicationDbContext db,
        int idActivo,
        CancellationToken cancellationToken,
        bool ignorarFiltrosEmpresa = false)
    {
        var idEmpresa = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(db, idActivo, cancellationToken);
        if (!idEmpresa.HasValue)
        {
            return false;
        }

        // Llamadas anonimas (p. ej. auto-registro del agente) no tienen empresas
        // autorizadas: con los query filters activos no verian ningun tipo/asignacion.
        var tiposQuery = db.TiposAsignacion.AsNoTracking();
        var asignacionesQuery = db.Asignaciones.AsNoTracking();
        if (ignorarFiltrosEmpresa)
        {
            tiposQuery = tiposQuery.IgnoreQueryFilters();
            asignacionesQuery = asignacionesQuery.IgnoreQueryFilters();
        }

        var tipos = await tiposQuery
            .Where(t => t.IdEmpresa == idEmpresa.Value)
            .ToListAsync(cancellationToken);
        var idsBaja = tipos
            .Where(t => TipoAsignacionNombres.EsNombre(t.Nombre, TipoAsignacionNombres.Baja))
            .Select(t => t.Id)
            .ToList();

        if (idsBaja.Count == 0)
        {
            return false;
        }

        return await asignacionesQuery.AnyAsync(
            a => a.IdActivo == idActivo && a.Activa && idsBaja.Contains(a.IdTipoAsignacion),
            cancellationToken);
    }

    public static async Task<HashSet<int>> IdsDadosDeBajaAsync(
        IApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var tipos = await db.TiposAsignacion.AsNoTracking().ToListAsync(cancellationToken);
        var idsBaja = tipos
            .Where(t => TipoAsignacionNombres.EsNombre(t.Nombre, TipoAsignacionNombres.Baja))
            .Select(t => t.Id)
            .ToList();

        if (idsBaja.Count == 0)
        {
            return [];
        }

        var ids = await db.Asignaciones
            .AsNoTracking()
            .Where(a => a.Activa && idsBaja.Contains(a.IdTipoAsignacion))
            .Select(a => a.IdActivo)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }
}
