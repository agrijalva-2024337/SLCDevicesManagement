using System.ComponentModel.DataAnnotations;

namespace SLCDM.Domain.Entities;

public class TipoMantenimiento : SLCDM.Domain.Common.BaseEntity
{
    [Required(ErrorMessage = "El campo nombre es obligatorio")]
    [MaxLength(50, ErrorMessage = "El campo nombre no debe superar los 50 caracteres")]
    public string Nombre { get; set; } = string.Empty;
    [MaxLength(150, ErrorMessage = "El campo descripcion no debe superar los 150 caracteres")]
    public string? Descripcion { get; set; }
}