using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Usuarios.Commands;

public sealed record DisableUsuarioCommand(int Id);

public sealed class DisableUsuarioCommandValidator : AbstractValidator<DisableUsuarioCommand>
{
    public DisableUsuarioCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id usuario");
    }
}

public sealed class DisableUsuarioCommandHandler : ICommandHandler<DisableUsuarioCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DisableUsuarioCommand> _validator;

    public DisableUsuarioCommandHandler(IApplicationDbContext db, IValidator<DisableUsuarioCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DisableUsuarioCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Usuario", command.Id);

        var enAsignaciones = await _db.Asignaciones
            .IgnoreQueryFilters()
            .AnyAsync(a => a.IdUsuario == command.Id, cancellationToken);
        var enBajas = await _db.DetallesBaja
            .IgnoreQueryFilters()
            .AnyAsync(d => d.IdAutorizadoPor == command.Id, cancellationToken);
        if (enAsignaciones || enBajas)
        {
            throw new ConflictException(
                "No se puede deshabilitar el usuario porque tiene asignaciones o bajas asociadas.");
        }

        entity.Habilitado = false;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
