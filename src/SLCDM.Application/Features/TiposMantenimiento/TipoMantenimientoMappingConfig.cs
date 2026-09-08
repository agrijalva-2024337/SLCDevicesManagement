using Mapster;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.TiposMantenimiento;

public sealed class TipoMantenimientoMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<TipoMantenimiento, TipoMantenimientoDto>();
    }
}
