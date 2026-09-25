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
        // Origen/destino de traslados viven en detalle_traslado (no en observaciones).
        // UsuarioNombre / AutorizadoPorNombre se resuelven acá para que el historial
        // no dependa de que el cliente pueda listar /api/Usuarios.
        var items = await (
                from a in itemsQuery
                join d in _db.DetallesTraslado.AsNoTracking() on a.Id equals d.IdAsignacion into dj
                from d in dj.DefaultIfEmpty()
                join u in _db.Usuarios.AsNoTracking().IgnoreQueryFilters() on a.IdUsuario equals u.Id into uj
                from u in uj.DefaultIfEmpty()
                join b in _db.DetallesBaja.AsNoTracking() on a.Id equals b.IdAsignacion into bj
                from b in bj.DefaultIfEmpty()
                join ua in _db.Usuarios.AsNoTracking().IgnoreQueryFilters() on b.IdAutorizadoPor equals ua.Id into uaj
                from ua in uaj.DefaultIfEmpty()
                orderby a.FechaAsignacion descending
                select new
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
                    IdUbicacionOrigen = (int?)d.IdUbicacionOrigen,
                    IdUbicacionDestino = (int?)d.IdUbicacionDestino,
                    UsuarioNombre = u == null
                        ? null
                        : ((u.Nombres + " " + u.Apellidos).Trim()),
                    AutorizadoPorNombre = ua == null
                        ? null
                        : ((ua.Nombres + " " + ua.Apellidos).Trim()),
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
                a.DocumentoPdfHash,
                a.IdUbicacionOrigen,
                a.IdUbicacionDestino,
                string.IsNullOrWhiteSpace(a.UsuarioNombre) ? null : a.UsuarioNombre,
                string.IsNullOrWhiteSpace(a.AutorizadoPorNombre) ? null : a.AutorizadoPorNombre))
            .ToList();
    }
}
