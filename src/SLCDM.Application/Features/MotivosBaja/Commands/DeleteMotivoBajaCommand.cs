using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.MotivosBaja.Commands;

public sealed record DeleteMotivoBajaCommand(int Id);

public sealed class DeleteMotivoBajaCommandValidator : AbstractValidator<DeleteMotivoBajaCommand>
{
    public DeleteMotivoBajaCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id motivo baja");
    }
}

public sealed class DeleteMotivoBajaCommandHandler : ICommandHandler<DeleteMotivoBajaCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteMotivoBajaCommand> _validator;

    public DeleteMotivoBajaCommandHandler(IApplicationDbContext db, IValidator<DeleteMotivoBajaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteMotivoBajaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.MotivosBaja.FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("MotivoBaja", command.Id);

        if (MotivoBajaNombres.EsEstandar(entity.Nombre))
        {
            throw new ConflictException(
                $"No se puede eliminar el motivo estándar «{entity.Nombre}». Los flujos de baja dependen de ese registro.");
        }

        var enUso = await _db.DetallesBaja.AnyAsync(d => d.IdMotivoBaja == command.Id, cancellationToken);
        if (enUso)
        {
            throw new ConflictException(
                "No se puede eliminar el motivo de baja porque ya esta registrado en bajas.");
        }

        _db.MotivosBaja.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
