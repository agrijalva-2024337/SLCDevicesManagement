using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

public class Asignacion: SLCDM.Domain.Common.BaseAuditableEntity {

    [Required(ErrorMessage = "El campo activo es obligatorio")]
    public int IdActivo { get; set; }

    [ForeignKey("IdActivo")]
    public Activo? Activo { get; set; }

    [Required(ErrorMessage = "El campo usuario es obligatorio")]
    public int IdUsuario { get; set; }

    [ForeignKey("IdUsuario")]
    public Usuario? Usuario { get; set; }

    [Required(ErrorMessage = "El campo responsable es obligatorio")]
    public int IdResponsable { get; set; }

    [ForeignKey("IdResponsable")]
    public Usuario? Responsable { get; set; }

    [Required(ErrorMessage = "El campo estado es obligatorio")]
    public int IdEstado { get; set; }

    [ForeignKey("IdEstado")]
    public Estado? Estado { get; set; }

    [Required(ErrorMessage = "El campo fecha asignacion es obligatorio")]
    [DataType(DataType.Date)]
    [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
    public DateTime FechaAsignacion { get; set; }

    [DataType(DataType.Date)]
    [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
    public DateTime FechaDevolucion { get; set; }

    [MaxLength(500, ErrorMessage = "El campo observaciones no debe superar los 500 caracteres")]
    public string? Observaciones {get; set; } = string.Empty;

    public byte[]? FirmaEntrega { get; set; }

    [DataType(DataType.Date)]
    [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
    public DateTime FechaFirmaEntrega { get; set; }

    public byte[]? FirmaDevolucion { get; set; }

    [MaxLength(300, ErrorMessage = "El campo documento pdf url no debe superar los 300 caracteres")]
    public string? DocumentoPdfUrl { get; set; } = string.Empty;

    [DataType(DataType.Date)]
    [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
    public DateTime DocumentoPdfGenerardoEn { get; set; }

}