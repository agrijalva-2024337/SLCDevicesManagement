using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Token temporal para descargar el paquete del agente de rastreo sin login.
/// El InstallKey del lote NO vive en la URL: solo este token de corta vida.
/// </summary>
public class InstaladorAgenteToken : SLCDM.Domain.Common.BaseEntity
{
    [Required]
    [MaxLength(32, ErrorMessage = "El campo token no debe superar los 32 caracteres")]
    public string Token { get; set; } = string.Empty;

    public int IdUsuarioCreador { get; set; }

    [ForeignKey("IdUsuarioCreador")]
    public Usuario? UsuarioCreador { get; set; }

    public DateTime CreadoEn { get; set; }

    public DateTime ExpiraEn { get; set; }

    public DateTime? UsadoEn { get; set; }

    public bool Revocado { get; set; }
}
