using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

public class HistorialActivo: SLCDM.Domain.Common.BaseEntity {

    [ForeignKey("IdActivo")]
    public Activo? Activo { get; set; }

    public int? IdAsignacion { get; set; }

    [Required(ErrorMessage = "El campo detalle es obligatorio")]
    public int IdDetalleActivo { get; set; }

    [ForeignKey("IdDetalleActivo")]
    public DetalleActivo? DetalleActivo { get; set; }

    [DataType(DataType.Date)]
    [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
    public DateTime FechaHora { get; set; }

    [MaxLength(30, ErrorMessage = "El campo tipo operaciondebe tener como maximo 30 caracteres")]
    public string? TipoOperacion { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "El campo descripcion debe tener como maximo 300 caracteres")]
    public string? Descripcion { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "El campo informacion anterior debe tener como maximo 300 caracteres")]
    public string? InformacionAnterior { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "El campo informacion nueva debe tener como maximo 300 caracteres")]
    public string? InformacionNueva { get; set; } = string.Empty;
}