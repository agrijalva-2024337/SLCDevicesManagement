using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones;

public static class EstadoActivoNombres
{
    public const string Disponible = "Disponible";

    public const string Asignado = "Asignado";

    public const string EnMantenimiento = "En mantenimiento";

    public const string DadoDeBaja = "Dado de baja";

    public static readonly string[] Estandar =
    [
        Disponible,
        Asignado,
        EnMantenimiento,
        DadoDeBaja
    ];

    public static async Task<Estado> ObtenerRequeridoAsync(
        IApplicationDbContext db,
        string nombre,
        int idEmpresa,
        CancellationToken cancellationToken)
    {
        var estados = await db.Estados.AsNoTracking()
            .Where(e => e.IdEmpresa == idEmpresa)
            .ToListAsync(cancellationToken);
        var estado = estados.FirstOrDefault(e => TipoAsignacionNombres.EsNombre(e.Nombre, nombre));
        if (estado is null)
        {
            throw new ConflictException(
                $"No existe el estado '{nombre}' en el catalogo Estado de la empresa. Cree el registro antes de continuar.");
        }

        return estado;
    }
}
