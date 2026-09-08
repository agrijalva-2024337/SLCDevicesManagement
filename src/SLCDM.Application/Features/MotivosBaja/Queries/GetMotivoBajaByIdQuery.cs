using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.MotivosBaja.Queries;

public sealed record GetMotivoBajaByIdQuery(int Id);

public sealed class GetMotivoBajaByIdQueryValidator : AbstractValidator<GetMotivoBajaByIdQuery>
{
    public GetMotivoBajaByIdQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id motivo de baja");
    }
}

public sealed class GetMotivoBajaByIdQueryHandler : IQueryHandler<GetMotivoBajaByIdQuery, MotivoBajaDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetMotivoBajaByIdQuery> _validator;

    public GetMotivoBajaByIdQueryHandler(IApplicationDbContext db, IValidator<GetMotivoBajaByIdQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<MotivoBajaDto> HandleAsync(GetMotivoBajaByIdQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var entity = await _db.MotivosBaja.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("MotivoBaja", query.Id);

        return entity.Adapt<MotivoBajaDto>();
    }
}
