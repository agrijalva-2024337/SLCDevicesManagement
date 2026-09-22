using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.Estados.Commands;

public sealed record DeleteEstadoCommand(int Id);

public sealed class DeleteEstadoCommandValidator : AbstractValidator<DeleteEstadoCommand>
{
    public DeleteEstadoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id estado");
    }
}

public sealed class DeleteEstadoCommandHandler : ICommandHandler<DeleteEstadoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteEstadoCommand> _validator;

    public DeleteEstadoCommandHandler(IApplicationDbContext db, IValidator<DeleteEstadoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteEstadoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Estados.FirstOrDefaultAsync(e => e.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Estado", command.Id);

        if (EstadoActivoNombres.Estandar.Any(n => TipoAsignacionNombres.EsNombre(entity.Nombre, n)))
        {
            throw new ConflictException(
                $"No se puede eliminar el estado estándar «{entity.Nombre}». Los flujos de movimiento dependen de ese registro.");
        }

        var enAsignaciones = await _db.Asignaciones
            .IgnoreQueryFilters()
            .AnyAsync(a => a.IdEstado == command.Id, cancellationToken);
        var enActivos = await _db.Activos
            .IgnoreQueryFilters()
            .AnyAsync(a => a.IdEstado == command.Id, cancellationToken);
        if (enAsignaciones || enActivos)
        {
            throw new ConflictException(
                "No se puede eliminar el estado porque ya esta registrado en activos o asignaciones.");
        }

        _db.Estados.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
