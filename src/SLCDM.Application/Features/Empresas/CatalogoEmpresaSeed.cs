using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Empresas;

/// <summary>
/// Catálogo mínimo de Estado y TipoAsignacion que toda empresa necesita
/// para asignaciones, bajas, traslados y mantenimientos.
/// Idempotente: solo inserta los nombres estándar que falten.
/// </summary>
public static class CatalogoEmpresaSeed
{
    private static readonly (string Nombre, string Descripcion)[] EstadosConDescripcion =
    [
        (EstadoActivoNombres.Disponible, "Activo sin asignacion activa, listo para entregarse"),
        (EstadoActivoNombres.Asignado, "Activo entregado a un responsable, con asignacion activa"),
        (EstadoActivoNombres.EnMantenimiento, "Activo en un mantenimiento preventivo o correctivo en curso"),
        (EstadoActivoNombres.DadoDeBaja, "Activo dado de baja; no puede volver a asignarse, trasladarse ni entrar a mantenimiento"),
    ];

    private static readonly (string Nombre, string Descripcion)[] TiposConDescripcion =
    [
        (TipoAsignacionNombres.Asignacion, "Entrega de un activo a un responsable"),
        (TipoAsignacionNombres.Traslado, "Movimiento de un activo entre ubicaciones de la misma empresa"),
        (TipoAsignacionNombres.Mantenimiento, "Mantenimiento preventivo o correctivo de un activo"),
        (TipoAsignacionNombres.Baja, "Baja definitiva de un activo"),
    ];

    public static void AgregarEstandar(IApplicationDbContext db, int idEmpresa)
    {
        var estadosExistentes = db.Estados
            .IgnoreQueryFilters()
            .Where(e => e.IdEmpresa == idEmpresa)
            .Select(e => e.Nombre)
            .ToList();

        foreach (var (nombre, descripcion) in EstadosConDescripcion)
        {
            if (estadosExistentes.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.Estados.Add(new Estado
            {
                Nombre = nombre,
                Descripcion = descripcion,
                IdEmpresa = idEmpresa
            });
        }

        var tiposExistentes = db.TiposAsignacion
            .IgnoreQueryFilters()
            .Where(t => t.IdEmpresa == idEmpresa)
            .Select(t => t.Nombre)
            .ToList();

        foreach (var (nombre, descripcion) in TiposConDescripcion)
        {
            if (tiposExistentes.Any(n => TipoAsignacionNombres.EsNombre(n, nombre)))
            {
                continue;
            }

            db.TiposAsignacion.Add(new TipoAsignacion
            {
                Nombre = nombre,
                Descripcion = descripcion,
                IdEmpresa = idEmpresa
            });
        }
    }
}
