using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Dispositivos;

namespace SLCDM.Application.Features.Dispositivos.Queries;

public sealed record GetDispositivosRastreoQuery;

public sealed class GetDispositivosRastreoQueryHandler
    : IQueryHandler<GetDispositivosRastreoQuery, IReadOnlyList<DispositivoRastreoDto>>
{
    private readonly IApplicationDbContext _db;

    public GetDispositivosRastreoQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DispositivoRastreoDto>> HandleAsync(
        GetDispositivosRastreoQuery query,
        CancellationToken cancellationToken = default)
    {
        var items = await _db.DispositivosToken.AsNoTracking()
            .Where(d => !d.Revocado)
            .Include(d => d.Activo)
            .OrderByDescending(d => d.UltimoUsoEn)
            .Select(d => new DispositivoRastreoDto(
                d.Id,
                d.IdActivo,
                d.Activo!.Nombre,
                d.Activo.IdUbicacion,
                d.UltimaUbicacionDetectadaId,
                d.UltimoUsoEn,
                d.FueraDeRango,
                d.Revocado,
                d.CreadoEn,
                d.ExpiraEn))
            .ToListAsync(cancellationToken);

        return items;
    }
}
