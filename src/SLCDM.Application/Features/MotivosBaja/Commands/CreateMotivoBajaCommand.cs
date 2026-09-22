using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.MotivosBaja.Commands;

public sealed record CreateMotivoBajaCommand(string Nombre, string? Descripcion);

public sealed class CreateMotivoBajaCommandValidator : AbstractValidator<CreateMotivoBajaCommand>
{
    public CreateMotivoBajaCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(50).WithMessage("El campo nombre no debe superar los 50 caracteres.")
            .MustAsync(async (nombre, ct) =>
            {
                var normalized = nombre.Trim().ToLower();
                return !await db.MotivosBaja.AnyAsync(m => m.Nombre.ToLower() == normalized, ct);
            })
            .WithMessage("Ya existe un motivo de baja con el mismo nombre.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }
}

public sealed class CreateMotivoBajaCommandHandler : ICommandHandler<CreateMotivoBajaCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateMotivoBajaCommand> _validator;

    public CreateMotivoBajaCommandHandler(IApplicationDbContext db, IValidator<CreateMotivoBajaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateMotivoBajaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<MotivoBaja>();
        entity.Nombre = command.Nombre.Trim();
        _db.MotivosBaja.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
