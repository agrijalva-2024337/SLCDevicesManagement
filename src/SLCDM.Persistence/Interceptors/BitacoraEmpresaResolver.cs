using Microsoft.EntityFrameworkCore;
using SLCDM.Domain.Entities;

namespace SLCDM.Persistence.Interceptors;

/// <summary>
/// Deriva <see cref="Bitacora.IdEmpresa"/> desde la entidad auditada.
/// Nunca lanza: si no se puede resolver, deja null para no tumbar la operación.
/// </summary>
internal static class BitacoraEmpresaResolver
{
    public static int? TryResolve(DbContext context, object entity)
    {
        try
        {
            return Resolve(context, entity);
        }
        catch
        {
            return null;
        }
    }

    private static int? Resolve(DbContext context, object entity) =>
        entity switch
        {
            Empresa empresa => empresa.Id,
            Pais pais => pais.IdEmpresa,
            CategoriaActivo categoria => categoria.IdEmpresa,
            Sede sede => sede.IdEmpresa,
            Usuario usuario => EmpresaIdDeUsuario(context, usuario.Id),
            Proveedor proveedor => proveedor.IdEmpresa,
            Area area => EmpresaIdDeSede(context, area.IdSede),
            Ubicacion ubicacion => EmpresaIdDeSede(context, ubicacion.IdSede),
            Responsable responsable => EmpresaIdDeArea(context, responsable.IdArea),
            HistoricoInventario historico => EmpresaIdDeSede(context, historico.IdSede),
            Activo activo => EmpresaIdDeProveedor(context, activo.IdProveedor),
            Asignacion asignacion => EmpresaIdDeActivo(context, asignacion.IdActivo),
            DetalleActivo detalleActivo => EmpresaIdDeActivo(context, detalleActivo.IdActivo),
            DetalleMantenimiento detalleMantenimiento => EmpresaIdDeAsignacion(context, detalleMantenimiento.IdAsignacion),
            DetalleBaja detalleBaja => EmpresaIdDeAsignacion(context, detalleBaja.IdAsignacion),
            DetalleTraslado detalleTraslado => EmpresaIdDeAsignacion(context, detalleTraslado.IdAsignacion),
            HistorialActivo historial => ResolveHistorial(context, historial),
            DispositivoToken token => EmpresaIdDeActivo(context, token.IdActivo),
            RedConocida red => EmpresaIdDeUbicacion(context, red.IdUbicacion),
            Estado => null,
            TipoAsignacion => null,
            TipoMantenimiento => null,
            MotivoBaja => null,
            _ => null
        };

    private static int? ResolveHistorial(DbContext context, HistorialActivo historial)
    {
        if (historial.IdAsignacion is int idAsignacion)
        {
            return EmpresaIdDeAsignacion(context, idAsignacion);
        }

        if (historial.IdDetalleActivo is int idDetalle)
        {
            return EmpresaIdDeDetalleActivo(context, idDetalle);
        }

        return null;
    }

    private static int? EmpresaIdDeUsuario(DbContext context, int idUsuario) =>
        context.Set<UsuarioEmpresa>().IgnoreQueryFilters().AsNoTracking()
            .Where(ue => ue.IdUsuario == idUsuario)
            .OrderBy(ue => ue.IdEmpresa)
            .Select(ue => (int?)ue.IdEmpresa)
            .FirstOrDefault();

    private static int? EmpresaIdDeSede(DbContext context, int idSede) =>
        context.Set<Sede>().IgnoreQueryFilters().AsNoTracking()
            .Where(s => s.Id == idSede)
            .Select(s => (int?)s.IdEmpresa)
            .FirstOrDefault();

    private static int? EmpresaIdDeArea(DbContext context, int idArea)
    {
        var idSede = context.Set<Area>().IgnoreQueryFilters().AsNoTracking()
            .Where(a => a.Id == idArea)
            .Select(a => (int?)a.IdSede)
            .FirstOrDefault();
        return idSede is null ? null : EmpresaIdDeSede(context, idSede.Value);
    }

    private static int? EmpresaIdDeProveedor(DbContext context, int idProveedor) =>
        context.Set<Proveedor>().IgnoreQueryFilters().AsNoTracking()
            .Where(p => p.Id == idProveedor)
            .Select(p => (int?)p.IdEmpresa)
            .FirstOrDefault();

    private static int? EmpresaIdDeActivo(DbContext context, int idActivo)
    {
        var idProveedor = context.Set<Activo>().IgnoreQueryFilters().AsNoTracking()
            .Where(a => a.Id == idActivo)
            .Select(a => (int?)a.IdProveedor)
            .FirstOrDefault();
        return idProveedor is null ? null : EmpresaIdDeProveedor(context, idProveedor.Value);
    }

    private static int? EmpresaIdDeAsignacion(DbContext context, int idAsignacion)
    {
        var idActivo = context.Set<Asignacion>().IgnoreQueryFilters().AsNoTracking()
            .Where(a => a.Id == idAsignacion)
            .Select(a => (int?)a.IdActivo)
            .FirstOrDefault();
        return idActivo is null ? null : EmpresaIdDeActivo(context, idActivo.Value);
    }

    private static int? EmpresaIdDeDetalleActivo(DbContext context, int idDetalle)
    {
        var idActivo = context.Set<DetalleActivo>().IgnoreQueryFilters().AsNoTracking()
            .Where(d => d.Id == idDetalle)
            .Select(d => (int?)d.IdActivo)
            .FirstOrDefault();
        return idActivo is null ? null : EmpresaIdDeActivo(context, idActivo.Value);
    }

    private static int? EmpresaIdDeUbicacion(DbContext context, int idUbicacion)
    {
        var idSede = context.Set<Ubicacion>().IgnoreQueryFilters().AsNoTracking()
            .Where(u => u.Id == idUbicacion)
            .Select(u => (int?)u.IdSede)
            .FirstOrDefault();
        return idSede is null ? null : EmpresaIdDeSede(context, idSede.Value);
    }
}
