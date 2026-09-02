using Mapster;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.DetallesActivos;

public sealed class DetalleActivoMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<DetalleActivo, DetalleActivoDto>();
    }
}
