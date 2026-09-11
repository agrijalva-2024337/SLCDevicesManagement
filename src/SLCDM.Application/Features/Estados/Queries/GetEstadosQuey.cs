using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Estados.Queries;

public sealed record GetEstadosQuery(int? IdEmpresa = null);

public sealed class GetEstadosQueryHandler : IQueryHandler<GetEstadosQuery, IReadOnlyList<EstadoDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetEstadosQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<EstadoDto>> HandleAsync(
        GetEstadosQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = _db.Estados.AsNoTracking();

        if (!_currentUser.IsAdministradorGeneral)
        {
            var autorizadas = _currentUser.EmpresasAutorizadas;
            items = items.Where(e => autorizadas.Contains(e.IdEmpresa));
        }

        if (query.IdEmpresa.HasValue)
        {
            items = items.Where(e => e.IdEmpresa == query.IdEmpresa.Value);
        }

        var list = await items
            .OrderBy(e => e.Nombre)
            .ToListAsync(cancellationToken);

        return list.Adapt<List<EstadoDto>>();
    }
}
