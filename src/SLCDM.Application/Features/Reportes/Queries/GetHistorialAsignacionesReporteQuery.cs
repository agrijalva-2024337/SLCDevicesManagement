using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.Reportes.Queries;

public sealed record GetHistorialAsignacionesReporteQuery(
    int? IdEmpresa = null,
    DateTime? FechaDesde = null,
    DateTime? FechaHasta = null);

public sealed class GetHistorialAsignacionesReporteQueryValidator
    : AbstractValidator<GetHistorialAsignacionesReporteQuery>
{
    public GetHistorialAsignacionesReporteQueryValidator()
    {
        RuleFor(x => x.IdEmpresa).OptionalId("id empresa");

        RuleFor(x => x)
            .Must(x => !x.FechaDesde.HasValue || !x.FechaHasta.HasValue || x.FechaDesde.Value.Date <= x.FechaHasta.Value.Date)
            .WithMessage("El campo fechaDesde no puede ser posterior a fechaHasta.");
    }
}

public sealed class GetHistorialAsignacionesReporteQueryHandler
    : IQueryHandler<GetHistorialAsignacionesReporteQuery, IReadOnlyList<HistorialAsignacionReporteDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<GetHistorialAsignacionesReporteQuery> _validator;

    public GetHistorialAsignacionesReporteQueryHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<GetHistorialAsignacionesReporteQuery> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<IReadOnlyList<HistorialAsignacionReporteDto>> HandleAsync(
        GetHistorialAsignacionesReporteQuery query,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var idEmpresa = ActivoReporteConsulta.EmpresaEfectiva(_currentUser, query.IdEmpresa);

        // Solo tipo "Asignacion" (no Traslado/Mantenimiento/Baja): esos van a
        // movimientos o al reporte de mantenimientos.
        var filasQuery =
            from a in _db.Asignaciones.AsNoTracking()
            join act in _db.Activos.AsNoTracking() on a.IdActivo equals act.Id
            join p in _db.Proveedores.AsNoTracking() on act.IdProveedor equals p.Id
            join e in _db.Empresas.AsNoTracking() on p.IdEmpresa equals e.Id
            join r in _db.Responsables.AsNoTracking() on a.IdResponsable equals r.Id
            join t in _db.TiposAsignacion.AsNoTracking() on a.IdTipoAsignacion equals t.Id
            select new
            {
                a.Id,
                a.IdActivo,
                NombreActivo = act.Nombre,
                act.NumeroSerie,
                a.IdResponsable,
                NombreResponsable = r.NombreCompleto,
                a.IdTipoAsignacion,
                TipoAsignacion = t.Nombre,
                a.FechaAsignacion,
                a.FechaDevolucion,
                a.Activa,
                a.Observaciones,
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
            filasQuery = filasQuery.Where(x => x.FechaAsignacion.Date >= desde);
        }

        if (query.FechaHasta.HasValue)
        {
            var hasta = query.FechaHasta.Value.Date;
            filasQuery = filasQuery.Where(x => x.FechaAsignacion.Date <= hasta);
        }

        var filas = await filasQuery
            .OrderByDescending(x => x.FechaAsignacion)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

        return filas
            .Where(x => TipoAsignacionNombres.EsNombre(x.TipoAsignacion, TipoAsignacionNombres.Asignacion))
            .Select(x => new HistorialAsignacionReporteDto(
                x.Id,
                x.IdActivo,
                x.NombreActivo,
                x.NumeroSerie,
                x.IdResponsable,
                x.NombreResponsable,
                x.IdTipoAsignacion,
                x.TipoAsignacion,
                x.FechaAsignacion,
                x.FechaDevolucion,
                x.Activa,
                x.Observaciones,
                x.IdEmpresa,
                x.NombreEmpresa))
            .ToList();
    }
}
