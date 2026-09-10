using System.ComponentModel.DataAnnotations.Schema;
using SLCDM.Domain.Enums;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla puente usuario ↔ empresa. Permite asociar un usuario a varias
/// empresas (AdministradorEmpresa de un subconjunto). La columna
/// <see cref="Usuario.IdEmpresa"/> se mantiene temporalmente (Tarea 5 la retira).
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
