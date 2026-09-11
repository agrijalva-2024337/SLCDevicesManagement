namespace SLCDM.Application.Features.Estados;

public sealed record EstadoDto(
    int Id,
    int IdEmpresa,
    string Nombre,
    string? Descripcion);
