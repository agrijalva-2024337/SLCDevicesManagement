using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.TiposAsignacion.Commands;

public sealed record DeleteTipoAsignacionCommand(int Id);

public sealed class DeleteTipoAsignacionCommandValidator : AbstractValidator<DeleteTipoAsignacionCommand>
{
    public DeleteTipoAsignacionCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id tipo asignacion");
    }
}

public sealed class DeleteTipoAsignacionCommandHandler : ICommandHandler<DeleteTipoAsignacionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteTipoAsignacionCommand> _validator;

    public DeleteTipoAsignacionCommandHandler(IApplicationDbContext db, IValidator<DeleteTipoAsignacionCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteTipoAsignacionCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.TiposAsignacion.FirstOrDefaultAsync(t => t.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("TipoAsignacion", command.Id);

        if (TipoAsignacionNombres.EsGlobal(entity.Nombre))
        {
            throw new ConflictException(
                "No se puede eliminar este tipo de asignacion porque es global del sistema. Solo se pueden eliminar los tipos que se registren despues.");
        }

        var enUso = await _db.Asignaciones
            .IgnoreQueryFilters()
            .AnyAsync(a => a.IdTipoAsignacion == command.Id, cancellationToken);
        if (enUso)
        {
            throw new ConflictException(
                "No se puede eliminar el tipo de asignacion porque ya esta registrado en asignaciones.");
        }

        _db.TiposAsignacion.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
