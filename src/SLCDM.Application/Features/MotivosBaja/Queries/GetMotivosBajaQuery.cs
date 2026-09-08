using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.MotivosBaja.Queries;

// El catalogo no tiene columna "habilitado" (ver MotivoBaja.cs) -- el query
// param ?incluirInhabilitados=true que manda el frontend (mismo helper que
// usan el resto de catalogos) simplemente se ignora aqui, no rompe nada.
public sealed record GetMotivosBajaQuery;

public sealed class GetMotivosBajaQueryHandler : IQueryHandler<GetMotivosBajaQuery, IReadOnlyList<MotivoBajaDto>>
{
    private readonly IApplicationDbContext _db;

    public GetMotivosBajaQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MotivoBajaDto>> HandleAsync(
        GetMotivosBajaQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = await _db.MotivosBaja
            .AsNoTracking()
            .OrderBy(m => m.Nombre)
            .ToListAsync(cancellationToken);

        return items.Adapt<List<MotivoBajaDto>>();
    }
}
