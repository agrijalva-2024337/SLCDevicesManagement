using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Asignaciones.Queries;

public sealed record GetAsignacionByIdQuery(int Id);

public sealed class GetAsignacionByIdQueryValidator : AbstractValidator<GetAsignacionByIdQuery>
{
    public GetAsignacionByIdQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id asignacion");
    }
}

public sealed class GetAsignacionByIdQueryHandler : IQueryHandler<GetAsignacionByIdQuery, AsignacionDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetAsignacionByIdQuery> _validator;

    public GetAsignacionByIdQueryHandler(IApplicationDbContext db, IValidator<GetAsignacionByIdQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<AsignacionDto> HandleAsync(GetAsignacionByIdQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var entity = await _db.Asignaciones.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("Asignacion", query.Id);

        var detalle = await _db.DetallesTraslado.AsNoTracking()
            .FirstOrDefaultAsync(d => d.IdAsignacion == query.Id, cancellationToken);

        var usuario = await _db.Usuarios.AsNoTracking().IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == entity.IdUsuario, cancellationToken);

        var detalleBaja = await _db.DetallesBaja.AsNoTracking()
            .FirstOrDefaultAsync(d => d.IdAsignacion == query.Id, cancellationToken);

        string? autorizadoPorNombre = null;
        if (detalleBaja is not null)
        {
            var autorizado = await _db.Usuarios.AsNoTracking().IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == detalleBaja.IdAutorizadoPor, cancellationToken);
            if (autorizado is not null)
            {
                autorizadoPorNombre = $"{autorizado.Nombres} {autorizado.Apellidos}".Trim();
            }
        }

        var dto = entity.Adapt<AsignacionDto>();
        var usuarioNombre = usuario is null
            ? null
            : $"{usuario.Nombres} {usuario.Apellidos}".Trim();

        return dto with
        {
            IdUbicacionOrigen = detalle?.IdUbicacionOrigen,
            IdUbicacionDestino = detalle?.IdUbicacionDestino,
            UsuarioNombre = string.IsNullOrWhiteSpace(usuarioNombre) ? null : usuarioNombre,
            AutorizadoPorNombre = string.IsNullOrWhiteSpace(autorizadoPorNombre) ? null : autorizadoPorNombre,
        };
    }
}
