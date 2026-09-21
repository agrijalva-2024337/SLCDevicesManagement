using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Sedes.Commands;

public sealed record DisableSedeCommand(int Id);

public sealed class DisableSedeCommandValidator : AbstractValidator<DisableSedeCommand>
{
    public DisableSedeCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id sede");
    }
}

public sealed class DisableSedeCommandHandler : ICommandHandler<DisableSedeCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DisableSedeCommand> _validator;

    public DisableSedeCommandHandler(IApplicationDbContext db, IValidator<DisableSedeCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DisableSedeCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Sedes.FirstOrDefaultAsync(s => s.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Sede", command.Id);

        var tieneAreas = await _db.Areas
            .IgnoreQueryFilters()
            .AnyAsync(a => a.IdSede == command.Id, cancellationToken);
        var tieneUbicaciones = await _db.Ubicaciones
            .IgnoreQueryFilters()
            .AnyAsync(u => u.IdSede == command.Id, cancellationToken);
        var tieneJornadas = await _db.HistoricosInventario
            .IgnoreQueryFilters()
            .AnyAsync(h => h.IdSede == command.Id, cancellationToken);
        if (tieneAreas || tieneUbicaciones || tieneJornadas)
        {
            throw new ConflictException(
                "No se puede deshabilitar la sede porque tiene areas, ubicaciones o jornadas de inventario asociadas.");
        }

        entity.Habilitado = false;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
