using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.TiposMantenimiento;

/// <summary>
/// Nombres sembrados en SeedCatalogosAddendum.sql. No se renombran ni eliminan.
/// </summary>
public static class TipoMantenimientoNombres
{
    public const string Preventivo = "Preventivo";
    public const string Correctivo = "Correctivo";

    public static readonly string[] Estandar =
    [
        Preventivo,
        Correctivo
    ];

    public static bool EsEstandar(string? nombre) =>
        Estandar.Any(n => TipoAsignacionNombres.EsNombre(nombre, n));
}
