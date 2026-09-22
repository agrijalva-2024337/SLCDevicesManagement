using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones.Queries;

public sealed record GetAsignacionesQuery(
    int? IdActivo = null,
    int? IdUsuario = null,
    bool? SoloActivas = null);

public sealed class GetAsignacionesQueryHandler : IQueryHandler<GetAsignacionesQuery, IReadOnlyList<AsignacionDto>>
{
    private readonly IApplicationDbContext _db;

    public GetAsignacionesQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AsignacionDto>> HandleAsync(
        GetAsignacionesQuery query,
        CancellationToken cancellationToken = default)
    {
        var itemsQuery = _db.Asignaciones.AsNoTracking();

        if (query.IdActivo.HasValue)
        {
            itemsQuery = itemsQuery.Where(a => a.IdActivo == query.IdActivo.Value);
        }

        if (query.IdUsuario.HasValue)
        {
            itemsQuery = itemsQuery.Where(a => a.IdUsuario == query.IdUsuario.Value);
        }

        if (query.SoloActivas.HasValue)
        {
            itemsQuery = itemsQuery.Where(a => a.Activa == query.SoloActivas.Value);
        }

        // La lista no trae las firmas: son varbinary(max) y en JSON (base64) revientan
        // activos, asignaciones y bajas. El PDF y el detalle las leen de la entidad.
        var items = await itemsQuery
            .OrderByDescending(a => a.FechaAsignacion)
            .Select(a => new
            {
                a.Id,
                a.IdActivo,
                a.IdUsuario,
                a.IdResponsable,
                a.IdEstado,
                a.IdTipoAsignacion,
                a.FechaAsignacion,
                a.FechaDevolucion,
                a.Activa,
                a.Observaciones,
                a.FechaFirmaEntrega,
                a.DocumentoPdfUrl,
                a.DocumentoPdfGenerardoEn,
                a.DocumentoPdfHash,
            })
            .ToListAsync(cancellationToken);

        return items
            .Select(a => new AsignacionDto(
                a.Id,
                a.IdActivo,
                a.IdUsuario,
                a.IdResponsable,
                a.IdEstado,
                a.IdTipoAsignacion,
                a.FechaAsignacion,
                a.FechaDevolucion,
                a.Activa,
                a.Observaciones,
                null,
                a.FechaFirmaEntrega,
                null,
                a.DocumentoPdfUrl,
                a.DocumentoPdfGenerardoEn,
                a.DocumentoPdfHash))
            .ToList();
    }
}
