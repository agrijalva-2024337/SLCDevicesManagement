using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Sedes.Commands;

public sealed record DeleteSedeCommand(int Id);

public sealed class DeleteSedeCommandValidator : AbstractValidator<DeleteSedeCommand>
{
    public DeleteSedeCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id sede");
    }
}

public sealed class DeleteSedeCommandHandler : ICommandHandler<DeleteSedeCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteSedeCommand> _validator;

    public DeleteSedeCommandHandler(IApplicationDbContext db, IValidator<DeleteSedeCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteSedeCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Sedes.FirstOrDefaultAsync(s => s.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Sede", command.Id);

        if (await _db.Areas.AnyAsync(a => a.IdSede == command.Id, cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la sede porque tiene areas asociadas.");
        }

        if (await _db.Ubicaciones.AnyAsync(u => u.IdSede == command.Id, cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la sede porque tiene ubicaciones asociadas.");
        }

        if (await _db.HistoricosInventario.AnyAsync(h => h.IdSede == command.Id, cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la sede porque tiene jornadas de inventario asociadas.");
        }

        _db.Sedes.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
