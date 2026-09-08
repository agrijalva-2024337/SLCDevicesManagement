namespace SLCDM.Application.Features.TiposMantenimiento;

public sealed record TipoMantenimientoDto(
    int Id,
    string Nombre,
    string? Descripcion);
