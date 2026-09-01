namespace SLCDM.Application.Features.DetallesActivo;

public sealed record DetalleActivoDto(
    int Id,
    int IdActivo,
    int IdHistoricoInventario,
    bool Encontrado,
    bool BuenEstado,
    string? Observaciones,
    DateTime FechaVerificacion
);