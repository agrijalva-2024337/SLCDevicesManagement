using System.ComponentModel.DataAnnotations;

namespace SLCDM.Domain.Entities;

public class Sede : SLCDM.Domain.Common.BaseAuditableEntity
{
    public int IdEmpresa { get; set; }
    public int IdPais { get; set; }
    [Required(ErrorMessage = "El campo nombre es obligatorio")]
    [MaxLength(100, ErrorMessage = "El campo nombre no debe superar los 100 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "El campo direccion no debe superar los 100 caracteres")]
    public string? Direccion { get; set; }

    [MaxLength(100, ErrorMessage = "El campo ciudad no debe superar los 100 caracteres")]
    public string? Ciudad { get; set; }
}