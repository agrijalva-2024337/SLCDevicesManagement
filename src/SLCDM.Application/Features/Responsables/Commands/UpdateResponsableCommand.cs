using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Responsables.Commands;

public sealed record UpdateResponsableCommand(
    int Id,
    int IdArea,
    string NombreCompleto,
    string? Cargo,
    string? Correo,
    string? Telefono,
    string? Dpi,
    bool Habilitado);

public sealed class UpdateResponsableCommandValidator : AbstractValidator<UpdateResponsableCommand>
{
    public UpdateResponsableCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.Id).RequiredId("id responsable");

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
                    .AnyAsync(r => r.Id != cmd.Id
                        && r.IdArea == cmd.IdArea
                        && r.NombreCompleto.ToLower() == normalized, ct);
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
                    .AnyAsync(r => r.Id != cmd.Id
                        && r.IdArea == cmd.IdArea
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
            .MustAsync(async (cmd, dpi, ct) =>
            {
                var normalized = DpiNormalizer.Normalize(dpi);
                return !await db.Responsables.IgnoreQueryFilters()
                    .AnyAsync(r => r.Id != cmd.Id && r.Dpi == normalized, ct);
            })
            .WithMessage("Ya existe un responsable con el mismo DPI.")
            .When(x => !string.IsNullOrWhiteSpace(x.Dpi));
    }
}

public sealed class UpdateResponsableCommandHandler : ICommandHandler<UpdateResponsableCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<UpdateResponsableCommand> _validator;

    public UpdateResponsableCommandHandler(IApplicationDbContext db, IValidator<UpdateResponsableCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateResponsableCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Responsables.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Responsable", command.Id);

        command.Adapt(entity);
        entity.NombreCompleto = command.NombreCompleto.Trim();
        entity.Correo = string.IsNullOrWhiteSpace(command.Correo) ? command.Correo : command.Correo.Trim().ToLowerInvariant();
        entity.Dpi = DpiNormalizer.Normalize(command.Dpi);

        await _db.SaveChangesAsync(cancellationToken);
    }
}
