using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

public class DetalleBaja : SLCDM.Domain.Common.BaseEntity
{
    [Required(ErrorMessage = "El campo asignacion es obligatorio")]
    public int IdAsignacion { get; set; }

    [ForeignKey("IdAsignacion")]
    public Asignacion? Asignacion { get; set; }

    [Required(ErrorMessage = "El campo motivo de baja es obligatorio")]
    public int IdMotivoBaja { get; set; }

    [ForeignKey("IdMotivoBaja")]
    public MotivoBaja? MotivoBaja { get; set; }

    [MaxLength(300, ErrorMessage = "El campo documento de referencia no debe superar los 300 caracteres")]
    public string? DocumentoReferencia { get; set; }

    [Required(ErrorMessage = "El campo autorizado por es obligatorio")]
    public int IdAutorizadoPor { get; set; }

    [ForeignKey("IdAutorizadoPor")]
    public Usuario? AutorizadoPor { get; set; }
}