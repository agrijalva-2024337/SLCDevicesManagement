using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Reportes;

internal static class ActivoEstadoOperativo
{
    public const string Disponible = "disponible";
    public const string Asignado = "asignado";
    public const string Mantenimiento = "mantenimiento";
    public const string Baja = "baja";

    public static bool EsEstadoValido(string? raw) =>
        TryNormalizar(raw, out _);

    public static bool TryNormalizar(string? raw, out string estado)
    {
        var n = TipoAsignacionNombres.Normalizar(raw).ToLowerInvariant();
        estado = n switch
        {
            Disponible or "disponibles" => Disponible,
            Asignado or "asignados" => Asignado,
            Mantenimiento or "enmantenimiento" => Mantenimiento,
            Baja or "dadosdebaja" or "dadodebaja" => Baja,
            _ => string.Empty
        };
        return estado.Length > 0;
    }

    public static string NombreVisible(string? estado) => estado switch
    {
        Asignado => "Asignado",
        Mantenimiento => "En mantenimiento",
        Baja => "Baja",
        _ => "Disponible"
    };
}

internal sealed record ActivoInventarioRow(
    Activo Activo,
    int IdSede,
    string NombreSede,
    int IdUbicacion,
    string NombreUbicacion,
    int IdEmpresa,
    string NombreEmpresa,
    string NombreCategoria,
    string EstadoOperativo,
    int? IdResponsable);

internal static class ActivoReporteConsulta
{
    public static int? EmpresaEfectiva(ICurrentUserService user, int? idEmpresaSolicitada)
    {
        if (user.IsAdministradorGeneral)
        {
            return idEmpresaSolicitada is > 0 ? idEmpresaSolicitada : null;
        }

        return user.ResolverEmpresaDestino(idEmpresaSolicitada) ?? user.EmpresaId;
    }

    // NOTA (fix aplicado en BE-23-reportes-historiales, ver guia de
    // Sprint 9 en el proyecto): esta version reemplaza la que trajo
    // BE-23-reportes-operativos (copiada tal cual del repo de prueba),
    // que tenia dos problemas reales contra el esquema de este repo:
    //
    // 1) La empresa de un activo se resolvia via Activo -> Ubicacion ->
    //    Sede -> Empresa con INNER JOIN. Como Activo.IdUbicacion es
    //    nullable aqui (no es obligatorio como en el repo de prueba),
    //    cualquier activo sin ubicacion asignada desaparecia de TODOS
    //    los reportes, incluido "inventario general". Ahora la empresa
    //    se resuelve via Activo -> Proveedor -> Empresa (IdProveedor es
    //    obligatorio), el mismo camino que ya usa el filtro multiempresa
    //    de EF Core para Activo (ApplyEmpresaQueryFilters en
    //    ApplicationDbContext.cs). Sede y Ubicacion se resuelven aparte
    //    y toleran ser nulas: un activo sin ubicacion sale en los
    //    reportes con IdSede=0, NombreSede="(sin sede)".
    //
    // 2) El estado operativo se reconstruia recorriendo el historial de
    //    Asignaciones activas + su TipoAsignacion en cada consulta. Desde
    //    BE-14/BE-18 el repo real ya mantiene Activo.IdEstado actualizado
    //    en cada comando (CreateAsignacionCommand, DevolverAsignacionCommand,
    //    CreateMantenimientoCommand, FinalizarMantenimientoCommand,
    //    CreateBajaCommand) -- no hace falta reconstruir nada, con leer
    //    Activo.IdEstado -> Estado.Nombre alcanza y es la fuente de
    //    verdad real. El responsable actual (solo hace falta cuando el
    //    estado es "asignado") si se sigue resolviendo desde la
    //    Asignacion activa, porque Activo no lo guarda directo.
    public static async Task<IReadOnlyList<ActivoInventarioRow>> CargarAsync(
        IApplicationDbContext db,
        int? idEmpresa,
        CancellationToken cancellationToken)
    {
        var query =
            from a in db.Activos.AsNoTracking()
            join p in db.Proveedores.AsNoTracking() on a.IdProveedor equals p.Id
            join e in db.Empresas.AsNoTracking() on p.IdEmpresa equals e.Id
            join c in db.CategoriasActivo.AsNoTracking() on a.IdCategoriaActivo equals c.Id
            select new
            {
                Activo = a,
                IdEmpresa = e.Id,
                NombreEmpresa = e.Nombre,
                NombreCategoria = c.Nombre
            };

        if (idEmpresa.HasValue)
        {
            query = query.Where(x => x.IdEmpresa == idEmpresa.Value);
        }

        var filas = await query.ToListAsync(cancellationToken);

        var ubicaciones = await db.Ubicaciones.AsNoTracking()
            .ToDictionaryAsync(u => u.Id, cancellationToken);
        var sedes = await db.Sedes.AsNoTracking()
            .ToDictionaryAsync(s => s.Id, cancellationToken);
        var estados = await db.Estados.AsNoTracking()
            .ToDictionaryAsync(es => es.Id, cancellationToken);
        var responsablesPorActivo = await ResponsableAsignadoPorActivoAsync(db, cancellationToken);

        var resultado = new List<ActivoInventarioRow>(filas.Count);

        foreach (var fila in filas)
        {
            var activo = fila.Activo;

            Ubicacion? ubicacion = activo.IdUbicacion.HasValue
                ? ubicaciones.GetValueOrDefault(activo.IdUbicacion.Value)
                : null;
            Sede? sede = ubicacion is not null ? sedes.GetValueOrDefault(ubicacion.IdSede) : null;

            var nombreEstado = activo.IdEstado.HasValue
                ? estados.GetValueOrDefault(activo.IdEstado.Value)?.Nombre
                : null;
            var estadoOperativo = EstadoOperativoDesdeNombre(nombreEstado);

            resultado.Add(new ActivoInventarioRow(
                activo,
                sede?.Id ?? 0,
                sede?.Nombre ?? "(sin sede)",
                ubicacion?.Id ?? 0,
                ubicacion?.Nombre ?? "(sin ubicacion)",
                fila.IdEmpresa,
                fila.NombreEmpresa,
                fila.NombreCategoria,
                estadoOperativo,
                estadoOperativo == ActivoEstadoOperativo.Asignado
                    ? responsablesPorActivo.GetValueOrDefault(activo.Id)
                    : null));
        }

        return resultado;
    }

    private static string EstadoOperativoDesdeNombre(string? nombreEstado)
    {
        if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.Asignado))
        {
            return ActivoEstadoOperativo.Asignado;
        }

        if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.EnMantenimiento))
        {
            return ActivoEstadoOperativo.Mantenimiento;
        }

        if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.DadoDeBaja))
        {
            return ActivoEstadoOperativo.Baja;
        }

        return ActivoEstadoOperativo.Disponible;
    }

    private static async Task<IReadOnlyDictionary<int, int>> ResponsableAsignadoPorActivoAsync(
        IApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var activas = await db.Asignaciones.AsNoTracking()
            .Where(a => a.Activa)
            .Select(a => new { a.IdActivo, a.IdResponsable, a.FechaAsignacion })
            .ToListAsync(cancellationToken);

        return activas
            .GroupBy(a => a.IdActivo)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(a => a.FechaAsignacion).First().IdResponsable);
    }
}
