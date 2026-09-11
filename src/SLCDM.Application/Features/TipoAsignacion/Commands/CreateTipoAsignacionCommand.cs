using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.TiposAsignacion.Commands;

public sealed record CreateTipoAsignacionCommand(
    int? IdEmpresa,
    string Nombre,
    string? Descripcion);

public sealed class CreateTipoAsignacionCommandValidator : AbstractValidator<CreateTipoAsignacionCommand>
{
    public CreateTipoAsignacionCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
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

                return !await db.TiposAsignacion.IgnoreQueryFilters()
                    .AnyAsync(t => t.IdEmpresa == idEmpresa && t.Nombre == nombre, ct);
            })
            .WithMessage("Ya existe un tipo de asignacion con el mismo nombre en esta empresa.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(150).WithMessage("El campo descripcion no debe superar los 150 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }

    internal static int? EmpresaDestino(ICurrentUserService currentUser, int? idEmpresaSolicitada) =>
        currentUser.ResolverEmpresaDestino(idEmpresaSolicitada);
}

public sealed class CreateTipoAsignacionCommandHandler : ICommandHandler<CreateTipoAsignacionCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateTipoAsignacionCommand> _validator;

    public CreateTipoAsignacionCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<CreateTipoAsignacionCommand> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateTipoAsignacionCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = CreateTipoAsignacionCommandValidator.EmpresaDestino(_currentUser, command.IdEmpresa)
            ?? throw new InvalidOperationException("No se pudo determinar la empresa del tipo de asignacion.");

        var entity = command.Adapt<TipoAsignacion>();
        entity.IdEmpresa = idEmpresa;

        _db.TiposAsignacion.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
