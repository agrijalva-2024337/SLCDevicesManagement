using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.TiposMantenimiento.Queries;

public sealed record GetTipoMantenimientoByIdQuery(int Id);

public sealed class GetTipoMantenimientoByIdQueryValidator : AbstractValidator<GetTipoMantenimientoByIdQuery>
{
    public GetTipoMantenimientoByIdQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id tipo mantenimiento");
    }
}

public sealed class GetTipoMantenimientoByIdQueryHandler : IQueryHandler<GetTipoMantenimientoByIdQuery, TipoMantenimientoDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetTipoMantenimientoByIdQuery> _validator;

    public GetTipoMantenimientoByIdQueryHandler(IApplicationDbContext db, IValidator<GetTipoMantenimientoByIdQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<TipoMantenimientoDto> HandleAsync(GetTipoMantenimientoByIdQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var entity = await _db.TiposMantenimiento.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("TipoMantenimiento", query.Id);

        return entity.Adapt<TipoMantenimientoDto>();
    }
}
