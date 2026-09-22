using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.TiposMantenimiento.Commands;

public sealed record DeleteTipoMantenimientoCommand(int Id);

public sealed class DeleteTipoMantenimientoCommandValidator : AbstractValidator<DeleteTipoMantenimientoCommand>
{
    public DeleteTipoMantenimientoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id tipo mantenimiento");
    }
}

public sealed class DeleteTipoMantenimientoCommandHandler : ICommandHandler<DeleteTipoMantenimientoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteTipoMantenimientoCommand> _validator;

    public DeleteTipoMantenimientoCommandHandler(
        IApplicationDbContext db,
        IValidator<DeleteTipoMantenimientoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteTipoMantenimientoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.TiposMantenimiento.FirstOrDefaultAsync(t => t.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("TipoMantenimiento", command.Id);

        if (TipoMantenimientoNombres.EsEstandar(entity.Nombre))
        {
            throw new ConflictException(
                $"No se puede eliminar el tipo estándar «{entity.Nombre}». Los flujos de mantenimiento dependen de ese registro.");
        }

        var enUso = await _db.DetallesMantenimiento.AnyAsync(d => d.IdTipoMantenimiento == command.Id, cancellationToken);
        if (enUso)
        {
            throw new ConflictException(
                "No se puede eliminar el tipo de mantenimiento porque ya esta registrado en mantenimientos.");
        }

        _db.TiposMantenimiento.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
