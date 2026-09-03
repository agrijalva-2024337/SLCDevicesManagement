using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

public class DetalleMantenimiento : SLCDM.Domain.Common.BaseEntity
{
    [Required(ErrorMessage = "El campo asignacion es obligatorio")]
    public int IdAsignacion { get; set; }

    [ForeignKey("IdAsignacion")]
    public Asignacion? Asignacion { get; set; }

    [Required(ErrorMessage = "El campo tipo mantenimiento es obligatorio")]
    public int IdTipoMantenimiento { get; set; }

    [ForeignKey("IdTipoMantenimiento")]
    public TipoMantenimiento? TipoMantenimiento { get; set; }

    [Required(ErrorMessage = "El campo descripcion del problema es obligatorio")]
    [MaxLength(300, ErrorMessage = "El campo descripcion del problema no debe superar los 300 caracteres")]
    public string DescripcionProblema { get; set; } = string.Empty;

   [MaxLength(300, ErrorMessage = "El campo trabajo realizado no debe superar los 300 caracteres")]
   public string? TrabajoRealizado { get; set; }

   [Range(0, double.MaxValue, ErrorMessage = "El campo costo debe ser mayor o igual a 0")]
    public decimal? Costo { get; set; }

   [MaxLength(50, ErrorMessage = "El campo numero factura no debe superar los 50 caracteres")]
    public string? NumeroFactura { get; set; }
}