using Mapster;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.CategoriasActivo;

public sealed class CategoriaActivoMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<CategoriaActivo, CategoriaActivoDto>();

        config.NewConfig<Commands.CreateCategoriaActivoCommand, CategoriaActivo>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.Empresa!);

        config.NewConfig<Commands.UpdateCategoriaActivoCommand, CategoriaActivo>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.IdEmpresa)
            .Ignore(dest => dest.Empresa!);
    }
}
