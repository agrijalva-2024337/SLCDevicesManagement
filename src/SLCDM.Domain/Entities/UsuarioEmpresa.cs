using System.ComponentModel.DataAnnotations.Schema;
using SLCDM.Domain.Enums;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla puente usuario ↔ empresa. Fuente de verdad de las empresas
/// autorizadas de un usuario (reemplaza la columna retirada usuario.id_empresa).
/// </summary>
public class UsuarioEmpresa : SLCDM.Domain.Common.BaseEntity
{
    public int IdUsuario { get; set; }

    [ForeignKey(nameof(IdUsuario))]
    public Usuario? Usuario { get; set; }

    public int IdEmpresa { get; set; }

    [ForeignKey(nameof(IdEmpresa))]
    public Empresa? Empresa { get; set; }

    public RolUsuario Rol { get; set; }
}
