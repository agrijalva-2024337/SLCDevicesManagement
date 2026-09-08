namespace SLCDM.Application.Features.CategoriasActivo;

public sealed record CategoriaActivoDto(
    int Id,
    bool Habilitado,
    int IdEmpresa,
    string Nombre,
    string? Descripcion);
