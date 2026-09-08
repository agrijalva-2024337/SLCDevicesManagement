using Mapster;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.MotivosBaja;

public sealed class MotivoBajaMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<MotivoBaja, MotivoBajaDto>();
    }
}
