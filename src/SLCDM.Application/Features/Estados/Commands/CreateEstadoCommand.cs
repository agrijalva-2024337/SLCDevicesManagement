using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Estados.Commands;

public sealed record CreateEstadoCommand(
    int? IdEmpresa,
    string Nombre,
    string? Descripcion);

public sealed class CreateEstadoCommandValidator : AbstractValidator<CreateEstadoCommand>
{
    public CreateEstadoCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        RuleFor(x => x.IdEmpresa)
            .Must(id => id is > 0)
            .When(_ => currentUser.IsAdministradorGeneral)
            .WithMessage("El campo id empresa es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(50).WithMessage("El campo nombre no debe superar los 50 caracteres.")
            .MustAsync(async (cmd, nombre, ct) =>
            {
                var idEmpresa = EmpresaDestino(currentUser, cmd.IdEmpresa);
                if (idEmpresa is null)
                {
                    return true;
                }

                return !await db.Estados.IgnoreQueryFilters()
                    .AnyAsync(e => e.IdEmpresa == idEmpresa && e.Nombre == nombre, ct);
            })
            .WithMessage("Ya existe un estado con el mismo nombre en esta empresa.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }

    internal static int? EmpresaDestino(ICurrentUserService currentUser, int? idEmpresaSolicitada) =>
        currentUser.ResolverEmpresaDestino(idEmpresaSolicitada);
}

public sealed class CreateEstadoCommandHandler : ICommandHandler<CreateEstadoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateEstadoCommand> _validator;

    public CreateEstadoCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<CreateEstadoCommand> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateEstadoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = CreateEstadoCommandValidator.EmpresaDestino(_currentUser, command.IdEmpresa)
            ?? throw new InvalidOperationException("No se pudo determinar la empresa del estado.");

        var entity = command.Adapt<Estado>();
        entity.IdEmpresa = idEmpresa;

        _db.Estados.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
