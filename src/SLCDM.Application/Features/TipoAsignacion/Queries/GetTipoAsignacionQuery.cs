using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.TiposAsignacion.Queries;

public sealed record GetTiposAsignacionQuery(int? IdEmpresa = null);

public sealed class GetTiposAsignacionQueryHandler : IQueryHandler<GetTiposAsignacionQuery, IReadOnlyList<TipoAsignacionDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTiposAsignacionQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<TipoAsignacionDto>> HandleAsync(
        GetTiposAsignacionQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = _db.TiposAsignacion.AsNoTracking();

        if (!_currentUser.IsAdministradorGeneral)
        {
            var autorizadas = _currentUser.EmpresasAutorizadas;
            items = items.Where(t => autorizadas.Contains(t.IdEmpresa));
        }

        if (query.IdEmpresa.HasValue)
        {
            items = items.Where(t => t.IdEmpresa == query.IdEmpresa.Value);
        }

        var list = await items
            .OrderBy(t => t.Nombre)
            .ToListAsync(cancellationToken);

        return list.Adapt<List<TipoAsignacionDto>>();
    }
}
