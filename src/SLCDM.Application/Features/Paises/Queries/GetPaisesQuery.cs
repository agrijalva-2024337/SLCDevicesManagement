using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Paises.Queries;

public sealed record GetPaisesQuery;

public sealed class GetPaisesQueryHandler : IQueryHandler<GetPaisesQuery, IReadOnlyList<PaisDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetPaisesQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<PaisDto>> HandleAsync(
        GetPaisesQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = _db.Paises.AsNoTracking();

        if (!_currentUser.IsAdministradorGeneral)
        {
            var idEmpresa = _currentUser.EmpresaId ?? -1;
            items = items.Where(p => p.IdEmpresa == idEmpresa);
        }

        var list = await items
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);

        return list.Adapt<List<PaisDto>>();
    }
}
