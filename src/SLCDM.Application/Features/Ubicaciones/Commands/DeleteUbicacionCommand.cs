using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Ubicaciones.Commands;

public sealed record DeleteUbicacionCommand(int Id);

public sealed class DeleteUbicacionCommandValidator : AbstractValidator<DeleteUbicacionCommand>
{
    public DeleteUbicacionCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id ubicacion");
    }
}

public sealed class DeleteUbicacionCommandHandler : ICommandHandler<DeleteUbicacionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteUbicacionCommand> _validator;

    public DeleteUbicacionCommandHandler(IApplicationDbContext db, IValidator<DeleteUbicacionCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteUbicacionCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Ubicaciones.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Ubicacion", command.Id);

        if (await _db.Activos.AnyAsync(a => a.IdUbicacion == command.Id, cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la ubicacion porque tiene activos asociados.");
        }

        if (await _db.DetallesTraslado.AnyAsync(
                t => t.IdUbicacionOrigen == command.Id || t.IdUbicacionDestino == command.Id,
                cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la ubicacion porque tiene traslados asociados.");
        }

        if (await _db.RedesConocidas.AnyAsync(r => r.IdUbicacion == command.Id, cancellationToken))
        {
            throw new ConflictException("No se puede eliminar la ubicacion porque tiene redes conocidas asociadas.");
        }

        _db.Ubicaciones.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
