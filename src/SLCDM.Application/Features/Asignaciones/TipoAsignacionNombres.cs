using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones;

public static class TipoAsignacionNombres
{
    public const string Asignacion = "Asignacion";

    public const string Traslado = "Traslado";

    public const string Mantenimiento = "Mantenimiento";

    public const string Baja = "Baja";

    public static string Normalizar(string? nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            return string.Empty;
        }

        return nombre.Trim()
            .Replace("ó", "o", StringComparison.OrdinalIgnoreCase)
            .Replace("Ó", "o", StringComparison.OrdinalIgnoreCase);
    }

    public static bool EsNombre(string? actual, string esperado) =>
        Normalizar(actual).Equals(Normalizar(esperado), StringComparison.OrdinalIgnoreCase);

    public static bool EsTipoQueOcupaActivo(string? nombre) =>
        EsNombre(nombre, Asignacion) || EsNombre(nombre, Mantenimiento);

    public static async Task<TipoAsignacion> ObtenerRequeridoAsync(
        IApplicationDbContext db,
        string nombre,
        CancellationToken cancellationToken)
    {
        var tipos = await db.TiposAsignacion.AsNoTracking().ToListAsync(cancellationToken);
        var tipo = tipos.FirstOrDefault(t => EsNombre(t.Nombre, nombre));
        if (tipo is null)
        {
            throw new ConflictException(
                $"No existe el tipo de asignacion '{nombre}' en el catalogo. Cree el registro antes de continuar.");
        }

        return tipo;
    }
}
