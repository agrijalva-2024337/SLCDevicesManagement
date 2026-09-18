using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Activos.Commands;

public sealed record EnableActivoCommand(int Id);

public sealed class EnableActivoCommandValidator : AbstractValidator<EnableActivoCommand>
{
    public EnableActivoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id activo");
    }
}

public sealed class EnableActivoCommandHandler : ICommandHandler<EnableActivoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<EnableActivoCommand> _validator;

    public EnableActivoCommandHandler(IApplicationDbContext db, IValidator<EnableActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(EnableActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Activos.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Activo", command.Id);

        entity.Habilitado = true;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
