using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.CategoriasActivo.Commands;

public sealed record CreateCategoriaActivoCommand(
    int? IdEmpresa,
    string Nombre,
    string? Descripcion);

public sealed class CreateCategoriaActivoCommandValidator : AbstractValidator<CreateCategoriaActivoCommand>
{
    public CreateCategoriaActivoCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        RuleFor(x => x.IdEmpresa)
            .Must(id => id is > 0)
            .When(_ => currentUser.IsAdministradorGeneral)
            .WithMessage("El campo id empresa es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(100).WithMessage("El campo nombre no puede tener más de 100 caracteres.")
            .MustAsync(async (cmd, nombre, ct) =>
            {
                var idEmpresa = EmpresaDestino(currentUser, cmd.IdEmpresa);
                if (idEmpresa is null)
                {
                    return true;
                }

                return !await db.CategoriasActivo.IgnoreQueryFilters()
                    .AnyAsync(c => c.IdEmpresa == idEmpresa && c.Nombre == nombre, ct);
            })
            .WithMessage("Ya existe una categoria de activo con el mismo nombre en esta empresa.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(200).WithMessage("El campo descripción no puede tener más de 200 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));
    }

    internal static int? EmpresaDestino(ICurrentUserService currentUser, int? idEmpresaSolicitada) =>
        currentUser.IsAdministradorGeneral ? idEmpresaSolicitada : currentUser.EmpresaId;
}

public sealed class CreateCategoriaActivoCommandHandler : ICommandHandler<CreateCategoriaActivoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateCategoriaActivoCommand> _validator;

    public CreateCategoriaActivoCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<CreateCategoriaActivoCommand> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<int> HandleAsync(
        CreateCategoriaActivoCommand command,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = CreateCategoriaActivoCommandValidator.EmpresaDestino(_currentUser, command.IdEmpresa)
            ?? throw new InvalidOperationException("No se pudo determinar la empresa de la categoria.");

        var entity = command.Adapt<CategoriaActivo>();
        entity.IdEmpresa = idEmpresa;
        entity.Habilitado = true;

        _db.CategoriasActivo.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
