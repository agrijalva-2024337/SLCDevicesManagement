namespace SLCDM.Domain.Enums;

/// <summary>
/// Perfiles de usuario del sistema (ver BE-09: Administrador general,
/// Administrador de empresa, Operador de inventario). Los valores
/// numericos se mantienen estables para no romper clientes que envian
/// el enum como entero.
/// </summary>
public enum RolUsuario
{
    OperadorInventario = 1,
    AdministradorEmpresa = 2,
    AdministradorGeneral = 3,
}
