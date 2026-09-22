using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Usuarios.Queries;

public sealed record GetUsuarioByIdQuery(int Id);

public sealed class GetUsuarioByIdQueryValidator : AbstractValidator<GetUsuarioByIdQuery>
{
    public GetUsuarioByIdQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id usuario");
    }
}

public sealed class GetUsuarioByIdQueryHandler : IQueryHandler<GetUsuarioByIdQuery, UsuarioDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<GetUsuarioByIdQuery> _validator;

    public GetUsuarioByIdQueryHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<GetUsuarioByIdQuery> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<UsuarioDto> HandleAsync(GetUsuarioByIdQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var q = _currentUser.IsAdministradorGeneral
            ? _db.Usuarios.IgnoreQueryFilters().AsNoTracking()
            : _db.Usuarios.AsNoTracking();

        var entity = await q.FirstOrDefaultAsync(u => u.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("Usuario", query.Id);

        var mapped = await UsuarioDtoMapper.MapAsync(_db, [entity], cancellationToken);
        return mapped[0];
    }
}
