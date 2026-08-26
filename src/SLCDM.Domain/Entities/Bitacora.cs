using System.ComponentModel.DataAnnotations;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Tabla `Bitacora` del ERD DERCAS (17 entidades, grupo empresarial y organizacion — BE-02).
/// </summary>
public class Bitacora : SLCDM.Domain.Common.BaseAuditableEntity
{
    public int IdUsuario { get; set; }

    public DateTime FechaHora { get; set; }

    [Required(ErrorMessage = "El campo tipo operacion es obligatorio")]
    [MaxLength(30, ErrorMessage = "El campo tipo operacion no debe superar los 30 caracteres")]
    public string TipoOperacion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo entidad afectada es obligatorio")]
    [MaxLength(100, ErrorMessage = "El campo entidad afectada no debe superar los 100 caracteres")]
    public string EntidadAfectada { get; set; } = string.Empty;

    [MaxLength(300, ErrorMessage = "El campo descripcion no debe superar los 300 caracteres")]
    public string? Descripcion { get; set; }

    public string? InformacionAnterior { get; set; }

    public string? InformacionNueva { get; set; }
}
