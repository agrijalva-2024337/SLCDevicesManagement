using SLCDM.Domain.Enums;

namespace SLCDM.Application.Common.Security;

/// <summary>
/// Valores estables de claim "role" para los perfiles de los usuarios del sistema.
/// </summary>
public static class Roles
{
    public const string OperadorInventario = nameof(RolUsuario.OperadorInventario);
    public const string AdministradorEmpresa = nameof(RolUsuario.AdministradorEmpresa);
    public const string AdministradorGeneral = nameof(RolUsuario.AdministradorGeneral);

    /// <summary> Get de catalogos y consulta de inventario: los 3 perfiles. </summary>
    public const string Lectura =
        OperadorInventario + "," + AdministradorEmpresa + "," + AdministradorGeneral;

    /// <summary> Altas operativas: activos, asignaciones, jornadas, ubicaciones, responsables. </summary>
    public const string EscrituraOperativa =
        OperadorInventario + "," + AdministradorEmpresa + "," + AdministradorGeneral;

    /// <summary> Administracion de empresa: usuarios, sedes, proveedores, categorias, bitacora. </summary>
    public const string EscrituraEmpresa =
        AdministradorEmpresa + "," + AdministradorGeneral;


    public static string ToClaimValue(this RolUsuario rol) => rol switch
    {
        RolUsuario.OperadorInventario => OperadorInventario,
        RolUsuario.AdministradorEmpresa => AdministradorEmpresa,
        RolUsuario.AdministradorGeneral => AdministradorGeneral,
        _ => throw new ArgumentOutOfRangeException(nameof(rol),"Perfil de usuario no soportado.")
    };
    
}
