using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones;

internal static class AsignacionEmpresaRules
{
    public static async Task<int?> EmpresaIdDeUbicacionAsync(
        IApplicationDbContext db,
        int idUbicacion,
        CancellationToken cancellationToken)
    {
        return await db.Ubicaciones
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(u => u.Id == idUbicacion)
            .Join(
                db.Sedes.AsNoTracking().IgnoreQueryFilters(),
                u => u.IdSede,
                s => s.Id,
                (_, s) => (int?)s.IdEmpresa)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static async Task<int?> EmpresaIdDeActivoAsync(
        IApplicationDbContext db,
        int idActivo,
        CancellationToken cancellationToken)
    {
        return await db.Activos
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(a => a.Id == idActivo)
            .Join(
                db.Proveedores.AsNoTracking().IgnoreQueryFilters(),
                a => a.IdProveedor,
                p => p.Id,
                (_, p) => (int?)p.IdEmpresa)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static async Task<int?> EmpresaIdDeUsuarioAsync(
        IApplicationDbContext db,
        int idUsuario,
        CancellationToken cancellationToken)
    {
        return await db.Usuarios
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(u => u.Id == idUsuario)
            .Select(u => u.IdEmpresa)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static async Task<int?> EmpresaIdDeResponsableAsync(
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
                (_, a) => a.IdSede)
            .Join(
                db.Sedes.AsNoTracking().IgnoreQueryFilters(),
                idSede => idSede,
                s => s.Id,
                (_, s) => (int?)s.IdEmpresa)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public static bool EmpresasCoinciden(int? empresaA, int? empresaB) =>
        !empresaA.HasValue || !empresaB.HasValue || empresaA.Value == empresaB.Value;

    public static async Task<bool> MismaEmpresaAsync(
        IApplicationDbContext db,
        int idActivo,
        int idUbicacionDestino,
        CancellationToken cancellationToken)
    {
        var empresaActivo = await EmpresaIdDeActivoAsync(db, idActivo, cancellationToken);
        var empresaDestino = await EmpresaIdDeUbicacionAsync(db, idUbicacionDestino, cancellationToken);

        return EmpresasCoinciden(empresaActivo, empresaDestino);
    }
}