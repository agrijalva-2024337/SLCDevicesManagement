using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.MotivosBaja;

/// <summary>
/// Nombres sembrados en SeedCatalogosAddendum.sql. No se renombran ni eliminan.
/// </summary>
public static class MotivoBajaNombres
{
    public const string Venta = "Venta";
    public const string Desecho = "Desecho";
    public const string Donacion = "Donacion";
    public const string Perdida = "Perdida";
    public const string Robo = "Robo";
    public const string DanoIrreparable = "Dano irreparable";
    public const string Otro = "Otro";

    public static readonly string[] Estandar =
    [
        Venta,
        Desecho,
        Donacion,
        Perdida,
        Robo,
        DanoIrreparable,
        Otro
    ];

    public static bool EsEstandar(string? nombre) =>
        Estandar.Any(n => TipoAsignacionNombres.EsNombre(nombre, n));
}
