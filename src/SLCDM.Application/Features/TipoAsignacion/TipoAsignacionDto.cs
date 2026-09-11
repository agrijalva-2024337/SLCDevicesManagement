namespace SLCDM.Application.Features.TiposAsignacion;

public sealed record TipoAsignacionDto(
    int Id,
    int IdEmpresa,
    string Nombre,
    string? Descripcion);
