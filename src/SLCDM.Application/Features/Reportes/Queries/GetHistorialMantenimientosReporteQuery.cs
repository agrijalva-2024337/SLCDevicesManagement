using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Reportes.Queries;

public sealed record GetHistorialMantenimientosReporteQuery(
    int? IdEmpresa = null,
    DateTime? FechaDesde = null,
    DateTime? FechaHasta = null);

public sealed class GetHistorialMantenimientosReporteQueryValidator
    : AbstractValidator<GetHistorialMantenimientosReporteQuery>
{
    public GetHistorialMantenimientosReporteQueryValidator()
    {
        RuleFor(x => x.IdEmpresa).OptionalId("id empresa");

        RuleFor(x => x)
            .Must(x => !x.FechaDesde.HasValue || !x.FechaHasta.HasValue || x.FechaDesde.Value.Date <= x.FechaHasta.Value.Date)
            .WithMessage("El campo fechaDesde no puede ser posterior a fechaHasta.");
    }
}

public sealed class GetHistorialMantenimientosReporteQueryHandler
    : IQueryHandler<GetHistorialMantenimientosReporteQuery, IReadOnlyList<HistorialMantenimientoReporteDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<GetHistorialMantenimientosReporteQuery> _validator;

    public GetHistorialMantenimientosReporteQueryHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<GetHistorialMantenimientosReporteQuery> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<IReadOnlyList<HistorialMantenimientoReporteDto>> HandleAsync(
        GetHistorialMantenimientosReporteQuery query,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var idEmpresa = ActivoReporteConsulta.EmpresaEfectiva(_currentUser, query.IdEmpresa);

        var filasQuery =
            from d in _db.DetallesMantenimiento.AsNoTracking()
            join a in _db.Asignaciones.AsNoTracking() on d.IdAsignacion equals a.Id
            join act in _db.Activos.AsNoTracking() on a.IdActivo equals act.Id
            join p in _db.Proveedores.AsNoTracking() on act.IdProveedor equals p.Id
            join e in _db.Empresas.AsNoTracking() on p.IdEmpresa equals e.Id
            join r in _db.Responsables.AsNoTracking() on a.IdResponsable equals r.Id
            join tm in _db.TiposMantenimiento.AsNoTracking() on d.IdTipoMantenimiento equals tm.Id
            select new
            {
                d.Id,
                d.IdAsignacion,
                IdActivo = act.Id,
                NombreActivo = act.Nombre,
                act.NumeroSerie,
                a.IdResponsable,
                NombreResponsable = r.NombreCompleto,
                IdProveedor = (int?)p.Id,
                NombreProveedor = p.Nombre,
                d.IdTipoMantenimiento,
                TipoMantenimiento = tm.Nombre,
                d.DescripcionProblema,
                d.TrabajoRealizado,
                d.Costo,
                d.NumeroFactura,
                FechaInicio = a.FechaAsignacion,
                FechaFin = a.FechaDevolucion,
                ActivoEnCurso = a.Activa,
                IdEmpresa = e.Id,
                NombreEmpresa = e.Nombre
            };

        if (idEmpresa.HasValue)
        {
            filasQuery = filasQuery.Where(x => x.IdEmpresa == idEmpresa.Value);
        }

        if (query.FechaDesde.HasValue)
        {
            var desde = query.FechaDesde.Value.Date;
            filasQuery = filasQuery.Where(x => x.FechaInicio.Date >= desde);
        }

        if (query.FechaHasta.HasValue)
        {
            var hasta = query.FechaHasta.Value.Date;
            filasQuery = filasQuery.Where(x => x.FechaInicio.Date <= hasta);
        }

        var filas = await filasQuery
            .OrderByDescending(x => x.FechaInicio)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

        return filas
            .Select(x => new HistorialMantenimientoReporteDto(
                x.Id,
                x.IdAsignacion,
                x.IdActivo,
                x.NombreActivo,
                x.NumeroSerie,
                x.IdResponsable,
                x.NombreResponsable,
                x.IdProveedor,
                x.NombreProveedor,
                x.IdTipoMantenimiento,
                x.TipoMantenimiento,
                x.DescripcionProblema,
                x.TrabajoRealizado,
                x.Costo,
                x.NumeroFactura,
                x.FechaInicio,
                x.FechaFin,
                x.ActivoEnCurso,
                x.IdEmpresa,
                x.NombreEmpresa))
            .ToList();
    }
}
