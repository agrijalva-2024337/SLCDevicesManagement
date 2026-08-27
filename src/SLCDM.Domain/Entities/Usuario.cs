using System.ComponentModel.DataAnnotations;
using SLCDM.Domain.Enums;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla `Usuario` del ERD DERCAS (17 entidades, grupo empresarial y organizacion — BE-02).
/// </summary>
public class Usuario : SLCDM.Domain.Common.BaseAuditableEntity
{
    public int? IdEmpresa { get; set; }

    [Required(ErrorMessage = "El campo nombres es obligatorio")]
    [MaxLength(100, ErrorMessage = "El campo nombres no debe superar los 100 caracteres")]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo apellidos es obligatorio")]
    [MaxLength(100, ErrorMessage = "El campo apellidos no debe superar los 100 caracteres")]
    public string Apellidos { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo correo es obligatorio")]
    [MaxLength(150, ErrorMessage = "El campo correo no debe superar los 150 caracteres")]
    [EmailAddress(ErrorMessage = "El formato del correo no es valido")]
    public string Correo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo username es obligatorio")]
    [MaxLength(50, ErrorMessage = "El campo username no debe superar los 50 caracteres")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo password hash es obligatorio")]
    [MaxLength(255, ErrorMessage = "El campo password hash no debe superar los 255 caracteres")]
    public string PasswordHash { get; set; } = string.Empty;

    public RolUsuario Rol { get; set; } = RolUsuario.Consulta;
}