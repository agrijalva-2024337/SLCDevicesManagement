using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.TiposMantenimiento.Commands;

public sealed record CreateTipoMantenimientoCommand(string Nombre, string? Descripcion);

public sealed class CreateTipoMantenimientoCommandValidator : AbstractValidator<CreateTipoMantenimientoCommand>
{
    public CreateTipoMantenimientoCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(50).WithMessage("El campo nombre no debe superar los 50 caracteres.")
            .MustAsync(async (nombre, ct) =>
            {
                var normalized = nombre.Trim().ToLower();
                return !await db.TiposMantenimiento.AnyAsync(t => t.Nombre.ToLower() == normalized, ct);
            })
            .WithMessage("Ya existe un tipo de mantenimiento con el mismo nombre.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }
}

public sealed class CreateTipoMantenimientoCommandHandler : ICommandHandler<CreateTipoMantenimientoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateTipoMantenimientoCommand> _validator;

    public CreateTipoMantenimientoCommandHandler(
        IApplicationDbContext db,
        IValidator<CreateTipoMantenimientoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateTipoMantenimientoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<TipoMantenimiento>();
        entity.Nombre = command.Nombre.Trim();
        _db.TiposMantenimiento.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
