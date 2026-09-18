using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SLCDM.Domain.Entities;

/// <summary>
/// Bytes exactos del acta emitida. QuestPDF no es byte-estable entre generaciones,
/// así que la descarga y la verificación deben usar este archivo, no uno regenerado.
/// </summary>
public class AsignacionDocumentoPdf
{
    [Key]
    public int IdAsignacion { get; set; }

    [ForeignKey(nameof(IdAsignacion))]
    public Asignacion? Asignacion { get; set; }

    [Required]
    public byte[] Contenido { get; set; } = [];
}
