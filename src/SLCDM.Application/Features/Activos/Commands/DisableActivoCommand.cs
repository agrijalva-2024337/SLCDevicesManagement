using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Activos.Commands;

public sealed record DisableActivoCommand(int Id);

public sealed class DisableActivoCommandValidator : AbstractValidator<DisableActivoCommand>
{
    public DisableActivoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id activo");
    }
}

public sealed class DisableActivoCommandHandler : ICommandHandler<DisableActivoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DisableActivoCommand> _validator;

    public DisableActivoCommandHandler(IApplicationDbContext db, IValidator<DisableActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DisableActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Activos.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Activo", command.Id);

        entity.Habilitado = false;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
