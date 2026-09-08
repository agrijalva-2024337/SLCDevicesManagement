using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.TiposMantenimiento.Queries;

// El catalogo no tiene columna "habilitado" (ver TipoMantenimiento.cs) -- el
// query param ?incluirInhabilitados=true que manda el frontend (mismo helper
// que usan el resto de catalogos) simplemente se ignora aqui, no rompe nada.
public sealed record GetTiposMantenimientoQuery;

public sealed class GetTiposMantenimientoQueryHandler : IQueryHandler<GetTiposMantenimientoQuery, IReadOnlyList<TipoMantenimientoDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTiposMantenimientoQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TipoMantenimientoDto>> HandleAsync(
        GetTiposMantenimientoQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = await _db.TiposMantenimiento
            .AsNoTracking()
            .OrderBy(t => t.Nombre)
            .ToListAsync(cancellationToken);

        return items.Adapt<List<TipoMantenimientoDto>>();
    }
}
