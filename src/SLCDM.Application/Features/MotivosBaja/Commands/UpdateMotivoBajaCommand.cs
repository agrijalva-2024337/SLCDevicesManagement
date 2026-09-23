using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.MotivosBaja.Commands;

public sealed record UpdateMotivoBajaCommand(int Id, string Nombre, string? Descripcion);

public sealed class UpdateMotivoBajaCommandValidator : AbstractValidator<UpdateMotivoBajaCommand>
{
    public UpdateMotivoBajaCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Id).RequiredId("id motivo baja");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(50).WithMessage("El campo nombre no debe superar los 50 caracteres.")
            .MustAsync(async (cmd, nombre, ct) =>
                !await db.MotivosBaja.AnyAsync(
                    m => m.Nombre.ToLower() == nombre.Trim().ToLower() && m.Id != cmd.Id, ct))
            .WithMessage("Ya existe un motivo de baja con el mismo nombre.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }
}

public sealed class UpdateMotivoBajaCommandHandler : ICommandHandler<UpdateMotivoBajaCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<UpdateMotivoBajaCommand> _validator;

    public UpdateMotivoBajaCommandHandler(IApplicationDbContext db, IValidator<UpdateMotivoBajaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateMotivoBajaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.MotivosBaja.FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("MotivoBaja", command.Id);

        var nombreNuevo = command.Nombre.Trim();
        if (MotivoBajaNombres.EsEstandar(entity.Nombre)
            && !TipoAsignacionNombres.EsNombre(entity.Nombre, nombreNuevo))
        {
            throw new ConflictException(
                $"No se puede renombrar el motivo estándar «{entity.Nombre}». Los flujos de baja dependen de ese nombre.");
        }

        command.Adapt(entity);
        entity.Nombre = nombreNuevo;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
