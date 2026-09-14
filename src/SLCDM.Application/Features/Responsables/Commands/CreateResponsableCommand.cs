using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Responsables.Commands;

public sealed record CreateResponsableCommand(
    int IdArea,
    string NombreCompleto,
    string? Cargo,
    string? Correo,
    string? Telefono,
    string? Dpi);

public sealed class CreateResponsableCommandValidator : AbstractValidator<CreateResponsableCommand>
{
    public CreateResponsableCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdArea)
            .RequiredId("id area")
            .MustAsync(async (id, ct) => await db.Areas.AnyAsync(a => a.Id == id, ct))
            .WithMessage("El campo id area no corresponde a un registro existente.");

        RuleFor(x => x.NombreCompleto)
            .NotEmpty().WithMessage("El campo nombre completo es obligatorio.")
            .MaximumLength(150).WithMessage("El campo nombre completo no debe superar los 150 caracteres.")
            .MustAsync(async (cmd, nombre, ct) =>
            {
                var normalized = nombre.Trim().ToLower();
                return !await db.Responsables.IgnoreQueryFilters()
                    .AnyAsync(r => r.IdArea == cmd.IdArea && r.NombreCompleto.ToLower() == normalized, ct);
            })
            .WithMessage("Ya existe un responsable con el mismo nombre en esta area.");

        RuleFor(x => x.Cargo)
            .MaximumLength(100).WithMessage("El campo cargo no debe superar los 100 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Cargo));

        RuleFor(x => x.Correo)
            .MaximumLength(150).WithMessage("El campo correo no debe superar los 150 caracteres.")
            .EmailAddress().WithMessage("El formato del correo no es valido.")
            .MustAsync(async (cmd, correo, ct) =>
            {
                var normalized = correo!.Trim().ToLower();
                return !await db.Responsables.IgnoreQueryFilters()
                    .AnyAsync(r => r.IdArea == cmd.IdArea
                        && r.Correo != null
                        && r.Correo.ToLower() == normalized, ct);
            })
            .WithMessage("Ya existe un responsable con el mismo correo en esta area.")
            .When(x => !string.IsNullOrWhiteSpace(x.Correo));

        RuleFor(x => x.Telefono)
            .MaximumLength(30).WithMessage("El campo telefono no debe superar los 30 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Telefono));

        RuleFor(x => x.Dpi)
            .Must(dpi => DpiNormalizer.IsValid(dpi))
            .WithMessage("El DPI debe tener 13 digitos.")
            .MustAsync(async (dpi, ct) =>
            {
                var normalized = DpiNormalizer.Normalize(dpi);
                return !await db.Responsables.IgnoreQueryFilters()
                    .AnyAsync(r => r.Dpi == normalized, ct);
            })
            .WithMessage("Ya existe un responsable con el mismo DPI.")
            .When(x => !string.IsNullOrWhiteSpace(x.Dpi));
    }
}

public sealed class CreateResponsableCommandHandler : ICommandHandler<CreateResponsableCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateResponsableCommand> _validator;

    public CreateResponsableCommandHandler(IApplicationDbContext db, IValidator<CreateResponsableCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateResponsableCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<Responsable>();
        entity.Habilitado = true;
        entity.NombreCompleto = command.NombreCompleto.Trim();
        entity.Correo = string.IsNullOrWhiteSpace(command.Correo) ? command.Correo : command.Correo.Trim().ToLowerInvariant();
        entity.Dpi = DpiNormalizer.Normalize(command.Dpi);

        _db.Responsables.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
