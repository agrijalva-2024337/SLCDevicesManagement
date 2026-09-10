using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Common.Security;

/// <summary>
/// Reglas de acceso multiempresa sobre <see cref="ICurrentUserService"/>.
/// </summary>
public static class CurrentUserEmpresaAccess
{
    public static bool TieneAccesoAEmpresa(this ICurrentUserService user, int? idEmpresa) =>
        user.IsAdministradorGeneral
        || (idEmpresa is int id && user.EmpresasAutorizadas.Contains(id));

    /// <summary>
    /// Empresa destino al crear/actualizar entidades con IdEmpresa opcional.
    /// AdminGeneral usa la solicitada; el resto valida contra su lista autorizada.
    /// </summary>
    public static int? ResolverEmpresaDestino(this ICurrentUserService user, int? idEmpresaSolicitada)
    {
        if (user.IsAdministradorGeneral)
        {
            return idEmpresaSolicitada;
        }

        if (idEmpresaSolicitada is int id && user.EmpresasAutorizadas.Contains(id))
        {
            return id;
        }

        if (user.EmpresasAutorizadas.Count == 1)
        {
            return user.EmpresasAutorizadas[0];
        }

        return user.EmpresaId;
    }
}
