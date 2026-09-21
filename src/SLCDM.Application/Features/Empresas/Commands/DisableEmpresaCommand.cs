using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Empresas.Commands;

public sealed record DisableEmpresaCommand(int Id);

public sealed class DisableEmpresaCommandValidator : AbstractValidator<DisableEmpresaCommand>
{
    public DisableEmpresaCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id empresa");
    }
}

public sealed class DisableEmpresaCommandHandler : ICommandHandler<DisableEmpresaCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DisableEmpresaCommand> _validator;

    public DisableEmpresaCommandHandler(IApplicationDbContext db, IValidator<DisableEmpresaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DisableEmpresaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Empresas.FirstOrDefaultAsync(e => e.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Empresa", command.Id);

        var tieneSedes = await _db.Sedes
            .IgnoreQueryFilters()
            .AnyAsync(s => s.IdEmpresa == command.Id, cancellationToken);
        var tieneProveedores = await _db.Proveedores
            .IgnoreQueryFilters()
            .AnyAsync(p => p.IdEmpresa == command.Id, cancellationToken);
        var tieneCategorias = await _db.CategoriasActivo
            .IgnoreQueryFilters()
            .AnyAsync(c => c.IdEmpresa == command.Id, cancellationToken);
        var tieneUsuarios = await _db.UsuariosEmpresas
            .AnyAsync(ue => ue.IdEmpresa == command.Id, cancellationToken);
        if (tieneSedes || tieneProveedores || tieneCategorias || tieneUsuarios)
        {
            throw new ConflictException(
                "No se puede deshabilitar la empresa porque tiene sedes, proveedores, categorias o usuarios asociados.");
        }

        entity.Habilitado = false;
        await _db.SaveChangesAsync(cancellationToken);
    }
}
