using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

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
        return await _db.DispositivosToken.AsNoTracking()
            .Where(d => !d.Revocado)
            .Select(d => new DispositivoRastreoDto(
                d.Id,
                d.IdActivo,
                d.Activo!.Nombre,
                d.FueraDeRango,
                d.UltimoUsoEn,
                d.UltimoBssid,
                d.OrigenCoordenada,
                d.UltimaLatitud,
                d.UltimaLongitud,
                d.Activo.IdUbicacion == null || d.Activo.Ubicacion == null
                    ? null
                    : new UbicacionMapaDto(
                        d.Activo.Ubicacion.Id,
                        d.Activo.Ubicacion.Nombre,
                        d.Activo.Ubicacion.Latitud,
                        d.Activo.Ubicacion.Longitud),
                d.UltimaUbicacionDetectada == null
                    ? null
                    : new UbicacionMapaDto(
                        d.UltimaUbicacionDetectada.Id,
                        d.UltimaUbicacionDetectada.Nombre,
                        d.UltimaUbicacionDetectada.Latitud,
                        d.UltimaUbicacionDetectada.Longitud)))
            .ToListAsync(cancellationToken);
    }
}