using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

namespace SLCDM.Application.Features.TiposMantenimiento.Commands;

public sealed record UpdateTipoMantenimientoCommand(int Id, string Nombre, string? Descripcion);

public sealed class UpdateTipoMantenimientoCommandValidator : AbstractValidator<UpdateTipoMantenimientoCommand>
{
    public UpdateTipoMantenimientoCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Id).RequiredId("id tipo mantenimiento");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(50).WithMessage("El campo nombre no debe superar los 50 caracteres.")
            .MustAsync(async (cmd, nombre, ct) =>
                !await db.TiposMantenimiento.AnyAsync(
                    t => t.Nombre.ToLower() == nombre.Trim().ToLower() && t.Id != cmd.Id, ct))
            .WithMessage("Ya existe un tipo de mantenimiento con el mismo nombre.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }
}

public sealed class UpdateTipoMantenimientoCommandHandler : ICommandHandler<UpdateTipoMantenimientoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<UpdateTipoMantenimientoCommand> _validator;

    public UpdateTipoMantenimientoCommandHandler(
        IApplicationDbContext db,
        IValidator<UpdateTipoMantenimientoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateTipoMantenimientoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.TiposMantenimiento.FirstOrDefaultAsync(t => t.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("TipoMantenimiento", command.Id);

        var nombreNuevo = command.Nombre.Trim();
        if (TipoMantenimientoNombres.EsEstandar(entity.Nombre)
            && !TipoAsignacionNombres.EsNombre(entity.Nombre, nombreNuevo))
        {
            throw new ConflictException(
                $"No se puede renombrar el tipo estándar «{entity.Nombre}». Los flujos de mantenimiento dependen de ese nombre.");
        }

        command.Adapt(entity);
        entity.Nombre = nombreNuevo;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
