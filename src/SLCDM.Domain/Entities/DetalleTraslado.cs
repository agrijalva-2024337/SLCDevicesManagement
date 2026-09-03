using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

public class DetalleTraslado : SLCDM.Domain.Common.BaseEntity
{
    [Required(ErrorMessage = "El campo asignacion es obligatorio")]
    public int IdAsignacion { get; set; }

    [ForeignKey("IdAsignacion")]
    public Asignacion? Asignacion { get; set; }

    [Required(ErrorMessage = "El campo ubicacion origen es obligatorio")]
    public int IdUbicacionOrigen { get; set; }

    [ForeignKey("IdUbicacionOrigen")]
    public Ubicacion? UbicacionOrigen { get; set; }

    [Required(ErrorMessage = "El campo ubicacion destino es obligatorio")]
    public int IdUbicacionDestino { get; set; }

    [ForeignKey("IdUbicacionDestino")]
    public Ubicacion? UbicacionDestino { get; set; }

    [MaxLength(300, ErrorMessage = "El campo motivo no debe superar los 300 caracteres")]
    public string? Motivo { get; set; }
}