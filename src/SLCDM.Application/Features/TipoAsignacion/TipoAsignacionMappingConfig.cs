using Mapster;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.TiposAsignacion;

public sealed class TipoAsignacionMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<TipoAsignacion, TipoAsignacionDto>();

        config.NewConfig<Commands.CreateTipoAsignacionCommand, TipoAsignacion>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.Empresa!);

        config.NewConfig<Commands.UpdateTipoAsignacionCommand, TipoAsignacion>()
            .Ignore(dest => dest.Id)
            .Ignore(dest => dest.IdEmpresa)
            .Ignore(dest => dest.Empresa!);
    }
}
