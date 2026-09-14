using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Reportes.Queries;

public sealed record GetHistorialMovimientosQuery(
    int? IdEmpresa = null,
    DateTime? FechaDesde = null,
    DateTime? FechaHasta = null);

public sealed class GetHistorialMovimientosQueryValidator : AbstractValidator<GetHistorialMovimientosQuery>
{
    public GetHistorialMovimientosQueryValidator()
    {
        RuleFor(x => x.IdEmpresa).OptionalId("id empresa");

        RuleFor(x => x)
            .Must(x => !x.FechaDesde.HasValue || !x.FechaHasta.HasValue || x.FechaDesde.Value.Date <= x.FechaHasta.Value.Date)
            .WithMessage("El campo fechaDesde no puede ser posterior a fechaHasta.");
    }
}

public sealed class GetHistorialMovimientosQueryHandler
    : IQueryHandler<GetHistorialMovimientosQuery, IReadOnlyList<HistorialMovimientoReporteDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<GetHistorialMovimientosQuery> _validator;

    public GetHistorialMovimientosQueryHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<GetHistorialMovimientosQuery> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<IReadOnlyList<HistorialMovimientoReporteDto>> HandleAsync(
        GetHistorialMovimientosQuery query,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var idEmpresa = ActivoReporteConsulta.EmpresaEfectiva(_currentUser, query.IdEmpresa);

        // HistorialActivo apunta a Asignacion o DetalleActivo; la empresa del activo
        // se resuelve via Proveedor (mismo camino que ActivoReporteConsulta).
        var porAsignacion =
            from h in _db.HistorialActivos.AsNoTracking()
            where h.IdAsignacion != null
            join a in _db.Asignaciones.AsNoTracking() on h.IdAsignacion equals a.Id
            join act in _db.Activos.AsNoTracking() on a.IdActivo equals act.Id
            join p in _db.Proveedores.AsNoTracking() on act.IdProveedor equals p.Id
            join e in _db.Empresas.AsNoTracking() on p.IdEmpresa equals e.Id
            select new
            {
                h.Id,
                IdActivo = act.Id,
                NombreActivo = act.Nombre,
                act.NumeroSerie,
                h.FechaHora,
                h.TipoOperacion,
                h.Descripcion,
                h.InformacionAnterior,
                h.InformacionNueva,
                IdEmpresa = e.Id,
                NombreEmpresa = e.Nombre
            };

        var porDetalle =
            from h in _db.HistorialActivos.AsNoTracking()
            where h.IdDetalleActivo != null
            join d in _db.DetallesActivos.AsNoTracking() on h.IdDetalleActivo equals d.Id
            join act in _db.Activos.AsNoTracking() on d.IdActivo equals act.Id
            join p in _db.Proveedores.AsNoTracking() on act.IdProveedor equals p.Id
            join e in _db.Empresas.AsNoTracking() on p.IdEmpresa equals e.Id
            select new
            {
                h.Id,
                IdActivo = act.Id,
                NombreActivo = act.Nombre,
                act.NumeroSerie,
                h.FechaHora,
                h.TipoOperacion,
                h.Descripcion,
                h.InformacionAnterior,
                h.InformacionNueva,
                IdEmpresa = e.Id,
                NombreEmpresa = e.Nombre
            };

        var rows = await porAsignacion.Concat(porDetalle).ToListAsync(cancellationToken);

        IEnumerable<HistorialMovimientoReporteDto> resultado = rows
            .Select(r => new HistorialMovimientoReporteDto(
                r.Id,
                r.IdActivo,
                r.NombreActivo,
                r.NumeroSerie,
                r.FechaHora,
                r.TipoOperacion,
                r.Descripcion,
                r.InformacionAnterior,
                r.InformacionNueva,
                r.IdEmpresa,
                r.NombreEmpresa));

        if (idEmpresa.HasValue)
        {
            resultado = resultado.Where(r => r.IdEmpresa == idEmpresa.Value);
        }

        if (query.FechaDesde.HasValue)
        {
            var desde = query.FechaDesde.Value.Date;
            resultado = resultado.Where(r => r.FechaHora.Date >= desde);
        }

        if (query.FechaHasta.HasValue)
        {
            var hasta = query.FechaHasta.Value.Date;
            resultado = resultado.Where(r => r.FechaHora.Date <= hasta);
        }

        return resultado
            .OrderByDescending(r => r.FechaHora)
            .ThenByDescending(r => r.Id)
            .ToList();
    }
}
