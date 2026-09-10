using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Paises.Commands;

public sealed record CreatePaisCommand(
    int? IdEmpresa,
    string Nombre,
    string CodigoIso2,
    string CodigoIso3,
    string? CodigoTelefonico);

public sealed class CreatePaisCommandValidator : AbstractValidator<CreatePaisCommand>
{
    public CreatePaisCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        RuleFor(x => x.IdEmpresa)
            .Must(id => id is > 0)
            .When(_ => currentUser.IsAdministradorGeneral)
            .WithMessage("El campo id empresa es obligatorio y debe ser mayor a 0.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(100).WithMessage("El campo nombre no debe superar los 100 caracteres.");

        RuleFor(x => x.CodigoIso2)
            .NotEmpty().WithMessage("El campo codigo iso2 es obligatorio.")
            .Length(2).WithMessage("El campo codigo iso2 debe tener 2 caracteres.")
            .MustAsync(async (cmd, iso2, ct) =>
            {
                var idEmpresa = EmpresaDestino(currentUser, cmd.IdEmpresa);
                if (idEmpresa is null)
                {
                    return true;
                }

                return !await db.Paises.IgnoreQueryFilters()
                    .AnyAsync(p => p.IdEmpresa == idEmpresa && p.CodigoIso2 == iso2.ToUpper(), ct);
            })
            .WithMessage("Ya existe un pais con el mismo codigo iso2 en esta empresa.");

        RuleFor(x => x.CodigoIso3)
            .NotEmpty().WithMessage("El campo codigo iso3 es obligatorio.")
            .Length(3).WithMessage("El campo codigo iso3 debe tener 3 caracteres.")
            .MustAsync(async (cmd, iso3, ct) =>
            {
                var idEmpresa = EmpresaDestino(currentUser, cmd.IdEmpresa);
                if (idEmpresa is null)
                {
                    return true;
                }

                return !await db.Paises.IgnoreQueryFilters()
                    .AnyAsync(p => p.IdEmpresa == idEmpresa && p.CodigoIso3 == iso3.ToUpper(), ct);
            })
            .WithMessage("Ya existe un pais con el mismo codigo iso3 en esta empresa.");

        RuleFor(x => x.CodigoTelefonico)
            .MaximumLength(5).WithMessage("El campo codigo telefonico no debe superar los 5 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.CodigoTelefonico));
    }

    internal static int? EmpresaDestino(ICurrentUserService currentUser, int? idEmpresaSolicitada) =>
        currentUser.ResolverEmpresaDestino(idEmpresaSolicitada);
}

public sealed class CreatePaisCommandHandler : ICommandHandler<CreatePaisCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreatePaisCommand> _validator;

    public CreatePaisCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<CreatePaisCommand> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreatePaisCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = CreatePaisCommandValidator.EmpresaDestino(_currentUser, command.IdEmpresa)
            ?? throw new InvalidOperationException("No se pudo determinar la empresa del pais.");

        var entity = command.Adapt<Pais>();
        entity.IdEmpresa = idEmpresa;
        entity.CodigoIso2 = command.CodigoIso2.ToUpperInvariant();
        entity.CodigoIso3 = command.CodigoIso3.ToUpperInvariant();

        _db.Paises.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
