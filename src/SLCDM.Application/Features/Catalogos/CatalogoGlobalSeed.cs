using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Application.Features.MotivosBaja;
using SLCDM.Application.Features.TiposMantenimiento;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Catalogos;

/// <summary>
/// Catálogos globales (sin empresa). Idempotente.
/// Antes solo vivían en Scripts/SeedCatalogosAddendum.sql (manual).
/// </summary>
public static class CatalogoGlobalSeed
{
    private static readonly (string Nombre, string Descripcion)[] TiposMantenimiento =
    [
        (TipoMantenimientoNombres.Preventivo, "Mantenimiento programado para prevenir fallas"),
        (TipoMantenimientoNombres.Correctivo, "Mantenimiento para reparar una falla ya ocurrida"),
    ];

    private static readonly (string Nombre, string Descripcion)[] MotivosBaja =
    [
        (MotivoBajaNombres.Venta, "El activo fue vendido"),
        (MotivoBajaNombres.Desecho, "El activo fue desechado por fin de vida util"),
        (MotivoBajaNombres.Donacion, "El activo fue donado"),
        (MotivoBajaNombres.Perdida, "El activo se extravio"),
        (MotivoBajaNombres.Robo, "El activo fue robado"),
        (MotivoBajaNombres.DanoIrreparable, "El activo sufrio un dano que no se puede reparar"),
        (MotivoBajaNombres.Otro, "Otro motivo autorizado, no listado arriba"),
    ];

    public static void AgregarEstandar(IApplicationDbContext db)
    {
        var tiposExistentes = db.TiposMantenimiento.Select(t => t.Nombre).ToList();
        foreach (var (nombre, descripcion) in TiposMantenimiento)
        {
            if (tiposExistentes.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.TiposMantenimiento.Add(new TipoMantenimiento
            {
                Nombre = nombre,
                Descripcion = descripcion
            });
        }

        var motivosExistentes = db.MotivosBaja.Select(m => m.Nombre).ToList();
        foreach (var (nombre, descripcion) in MotivosBaja)
        {
            if (motivosExistentes.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.MotivosBaja.Add(new MotivoBaja
            {
                Nombre = nombre,
                Descripcion = descripcion
            });
        }
    }
}
