using System.ComponentModel.DataAnnotations;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla `Responsable` del ERD DERCAS. Solo lleva `habilitado` — sin
/// fechas de auditoria (no estan en el diagrama).
/// </summary>
public class Responsable : SLCDM.Domain.Common.BaseHabilitadoEntity
{
    public int IdArea { get; set; }

    [Required(ErrorMessage = "El campo nombre completo es obligatorio")]
    [MaxLength(150, ErrorMessage = "El campo nombre completo no debe superar los 150 caracteres")]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "El campo cargo no debe superar los 100 caracteres")]
    public string? Cargo { get; set; }

    [MaxLength(150, ErrorMessage = "El campo correo no debe superar los 150 caracteres")]
    [EmailAddress(ErrorMessage = "El formato del correo no es valido")]
    public string? Correo { get; set; }

    [MaxLength(30, ErrorMessage = "El campo telefono no debe superar los 30 caracteres")]
    public string? Telefono { get; set; }

    /// <summary>
    /// CUI/DPI de Guatemala (13 dígitos). Nullable: responsables legacy sin dato.
    /// Se guarda limpio (solo dígitos); el formateo 4-5-4 es solo visual (PDF/UI).
    /// </summary>
    [MaxLength(20, ErrorMessage = "El campo DPI no debe superar los 20 caracteres")]
    public string? Dpi { get; set; }
}
