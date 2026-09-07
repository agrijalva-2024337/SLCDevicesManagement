using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Consulta.Queries;

public sealed record GetConsultaActivoQuery(string Token);

public sealed class GetConsultaActivoQueryValidator : AbstractValidator<GetConsultaActivoQuery>
{
    public GetConsultaActivoQueryValidator()
    {
        RuleFor(x => x.Token).NotEmpty().WithMessage("El campo token es obligatorio.");
    }
}

public sealed class GetConsultaActivoQueryHandler : IQueryHandler<GetConsultaActivoQuery, ConsultaActivoDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetConsultaActivoQuery> _validator;

    public GetConsultaActivoQueryHandler(IApplicationDbContext db, IValidator<GetConsultaActivoQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ConsultaActivoDto> HandleAsync(
        GetConsultaActivoQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var activo = await _db.Activos.IgnoreQueryFilters().AsNoTracking()
            .Include(a => a.CategoriaActivo)
            .Include(a => a.Proveedor)
            .Include(a => a.Ubicacion)
            .FirstOrDefaultAsync(a => a.TokenPublico == query.Token, cancellationToken)
            ?? throw new NotFoundException("Activo", query.Token);

        var empresa = await _db.Empresas.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == activo.Proveedor!.IdEmpresa, cancellationToken);

        Sede? sede = null;
        if (activo.Ubicacion is not null)
        {
            sede = await _db.Sedes.IgnoreQueryFilters().AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == activo.Ubicacion.IdSede, cancellationToken);
        }

        var estados = await _db.Estados.AsNoTracking().ToListAsync(cancellationToken);
        var nombreEstado = activo.IdEstado.HasValue
            ? estados.FirstOrDefault(e => e.Id == activo.IdEstado.Value)?.Nombre
            : null;

        string estadoOperativo;
        if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.Asignado))
        {
            estadoOperativo = "asignado";
        }
        else if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.EnMantenimiento))
        {
            estadoOperativo = "mantenimiento";
        }
        else if (TipoAsignacionNombres.EsNombre(nombreEstado, EstadoActivoNombres.DadoDeBaja))
        {
            estadoOperativo = "baja";
        }
        else
        {
            estadoOperativo = "disponible";
        }

        string? nombreResponsable = null;
        string? nombreArea = null;
        if (estadoOperativo == "asignado")
        {
            var asignacionActiva = await _db.Asignaciones.IgnoreQueryFilters().AsNoTracking()
                .Where(a => a.IdActivo == activo.Id && a.Activa)
                .OrderByDescending(a => a.FechaAsignacion)
                .FirstOrDefaultAsync(cancellationToken);

            if (asignacionActiva is not null)
            {
                var responsable = await _db.Responsables.IgnoreQueryFilters().AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == asignacionActiva.IdResponsable, cancellationToken);
                if (responsable is not null)
                {
                    nombreResponsable = responsable.NombreCompleto;
                    var area = await _db.Areas.IgnoreQueryFilters().AsNoTracking()
                        .FirstOrDefaultAsync(a => a.Id == responsable.IdArea, cancellationToken);
                    nombreArea = area?.Nombre;
                }
            }
        }

        return new ConsultaActivoDto(
            activo.Id,
            activo.Nombre,
            activo.Descripcion,
            activo.Marca,
            activo.Modelo,
            activo.NumeroSerie,
            activo.CategoriaActivo?.Nombre,
            empresa?.Nombre,
            sede?.Nombre,
            activo.Ubicacion?.Nombre,
            nombreArea,
            nombreResponsable,
            estadoOperativo,
            ActivoEstadoOperativoNombreVisible(estadoOperativo),
            activo.FechaVencimientoGarantia);
    }

    private static string ActivoEstadoOperativoNombreVisible(string estado) => estado switch
    {
        "asignado" => "Asignado",
        "mantenimiento" => "En mantenimiento",
        "baja" => "Baja",
        _ => "Disponible"
    };
}
