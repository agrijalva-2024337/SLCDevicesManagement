using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Empresas;

/// <summary>
/// Catálogo mínimo de Estado y TipoAsignacion que toda empresa nueva necesita
/// para asignaciones, bajas, traslados y mantenimientos.
/// </summary>
internal static class CatalogoEmpresaSeed
{
    public static void AgregarEstandar(IApplicationDbContext db, int idEmpresa)
    {
        foreach (var nombre in EstadoActivoNombres.Estandar)
        {
            db.Estados.Add(new Estado
            {
                Nombre = nombre,
                IdEmpresa = idEmpresa
            });
        }

        foreach (var nombre in TipoAsignacionNombres.Estandar)
        {
            db.TiposAsignacion.Add(new TipoAsignacion
            {
                Nombre = nombre,
                IdEmpresa = idEmpresa
            });
        }
    }
}
