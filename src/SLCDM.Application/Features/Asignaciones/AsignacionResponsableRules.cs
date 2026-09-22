using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones;

/// <summary>
/// Reglas de entrega a responsable: un activo por categoría, y misma sede
/// que la ubicación del activo (el responsable vive en Área → Sede).
/// </summary>
internal static class AsignacionResponsableRules
{
    public const string MensajeConflictoCategoria =
        "El responsable ya tiene un activo de esa categoria asignado. Solo se permite un activo por categoria.";

    public const string MensajeSedeDistinta =
        "El responsable debe pertenecer a la misma sede de la ubicacion del activo. No se puede asignar a otra sede u ubicacion.";

    public static async Task<int?> SedeIdDeUbicacionAsync(
        IApplicationDbContext db,
        int idUbicacion,
        CancellationToken cancellationToken)
    {
        return await db.Ubicaciones
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(u => u.Id == idUbicacion)
            .Select(u => (int?)u.IdSede)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static async Task<int?> SedeIdDeResponsableAsync(
        IApplicationDbContext db,
        int idResponsable,
        CancellationToken cancellationToken)
    {
        return await db.Responsables
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(r => r.Id == idResponsable)
            .Join(
                db.Areas.AsNoTracking().IgnoreQueryFilters(),
                r => r.IdArea,
                a => a.Id,
                (_, a) => (int?)a.IdSede)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static async Task<(bool Permitido, string? Mensaje)> PuedeAsignarMismaSedeAsync(
        IApplicationDbContext db,
        int idResponsable,
        int idUbicacion,
        CancellationToken cancellationToken)
    {
        var sedeUbicacion = await SedeIdDeUbicacionAsync(db, idUbicacion, cancellationToken);
        var sedeResponsable = await SedeIdDeResponsableAsync(db, idResponsable, cancellationToken);

        if (!sedeUbicacion.HasValue || !sedeResponsable.HasValue)
        {
            return (false, MensajeSedeDistinta);
        }

        if (sedeUbicacion.Value != sedeResponsable.Value)
        {
            return (false, MensajeSedeDistinta);
        }

        return (true, null);
    }

    public static async Task<(bool Permitido, string? Mensaje)> PuedeAsignarCategoriaAsync(
        IApplicationDbContext db,
        int idResponsable,
        int idActivo,
        CancellationToken cancellationToken)
    {
        var activo = await db.Activos.AsNoTracking()
            .Where(a => a.Id == idActivo)
            .Select(a => new { a.IdCategoriaActivo, a.Nombre })
            .FirstOrDefaultAsync(cancellationToken);

        if (activo is null)
        {
            return (true, null);
        }

        var categoriaNombre = await db.CategoriasActivo.AsNoTracking()
            .Where(c => c.Id == activo.IdCategoriaActivo)
            .Select(c => c.Nombre)
            .FirstOrDefaultAsync(cancellationToken) ?? "esta categoria";

        var candidatas = await (
                from a in db.Asignaciones.AsNoTracking()
                join t in db.TiposAsignacion.AsNoTracking() on a.IdTipoAsignacion equals t.Id
                join act in db.Activos.AsNoTracking() on a.IdActivo equals act.Id
                where a.Activa
                      && a.IdResponsable == idResponsable
                      && act.IdCategoriaActivo == activo.IdCategoriaActivo
                select new { ActivoNombre = act.Nombre, TipoNombre = t.Nombre })
            .ToListAsync(cancellationToken);

        var conflicto = candidatas.FirstOrDefault(c =>
            TipoAsignacionNombres.EsNombre(c.TipoNombre, TipoAsignacionNombres.Asignacion));

        if (conflicto is null)
        {
            return (true, null);
        }

        return (
            false,
            $"El responsable ya tiene un activo de la categoria «{categoriaNombre}» asignado ({conflicto.ActivoNombre}). Solo se permite un activo por categoria.");
    }
}
