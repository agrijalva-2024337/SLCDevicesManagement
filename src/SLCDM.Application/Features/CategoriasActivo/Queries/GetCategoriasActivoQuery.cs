using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.CategoriasActivo.Queries;

public sealed record GetCategoriasActivoQuery(bool IncluirInhabilitados = false);

public sealed class GetCategoriasActivoQueryHandler
    : IQueryHandler<GetCategoriasActivoQuery, IReadOnlyList<CategoriaActivoDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetCategoriasActivoQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<CategoriaActivoDto>> HandleAsync(
        GetCategoriasActivoQuery query,
        CancellationToken cancellationToken = default)
    {
        var itemsQuery = _db.CategoriasActivo.AsNoTracking();

        if (!_currentUser.IsAdministradorGeneral)
        {
            var idEmpresa = _currentUser.EmpresaId ?? -1;
            itemsQuery = itemsQuery.Where(c => c.IdEmpresa == idEmpresa);
        }

        if (!query.IncluirInhabilitados)
        {
            itemsQuery = itemsQuery.Where(c => c.Habilitado);
        }

        var items = await itemsQuery
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);

        return items.Adapt<List<CategoriaActivoDto>>();
    }
}
