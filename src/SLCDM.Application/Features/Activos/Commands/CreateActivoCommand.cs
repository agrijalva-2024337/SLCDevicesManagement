using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Activos.Commands;

public sealed record CreateActivoCommand(
    int IdCategoriaActivo,
    int IdProveedor,
    int IdUbicacion,
    string Nombre,
    string? Descripcion,
    string? Marca,
    string? Modelo,
    string? NumeroSerie,
    string? CodigoInterno,
    string? EspecificacionesHardware,
    string? PerifericosAdicionales,
    DateTime FechaCompra,
    decimal CostoAdquisicion,
    string? Moneda,
    string? NumeroFactura,
    DateTime FechaVencimientoGarantia,
    string? Observaciones);

public sealed class CreateActivoCommandValidator : AbstractValidator<CreateActivoCommand>
{
    public CreateActivoCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdCategoriaActivo)
            .RequiredId("id categoria activo")
            .MustAsync(async (cmd, id, ct) =>
            {
                var categoria = await db.CategoriasActivo.IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == id, ct);
                var proveedor = await db.Proveedores.IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == cmd.IdProveedor, ct);
                return categoria is not null
                    && proveedor is not null
                    && categoria.IdEmpresa == proveedor.IdEmpresa;
            })
            .WithMessage("La categoria debe pertenecer a la misma empresa del proveedor.");

        RuleFor(x => x.IdProveedor)
            .RequiredId("id proveedor")
            .MustAsync(async (id, ct) => await db.Proveedores.AnyAsync(p => p.Id == id, ct))
            .WithMessage("No se encontro un proveedor con el id informado.");

        RuleFor(x => x.IdUbicacion)
            .RequiredId("id ubicacion")
            .MustAsync(async (id, ct) => await db.Ubicaciones.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro una ubicacion con el id informado.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El campo nombre es obligatorio.")
            .MaximumLength(150).WithMessage("El campo nombre no debe superar los 150 caracteres.");

        RuleFor(x => x.Descripcion)
            .MaximumLength(300).WithMessage("El campo descripcion no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Descripcion));

        RuleFor(x => x.Marca)
            .MaximumLength(100).WithMessage("El campo marca no debe superar los 100 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Marca));

        RuleFor(x => x.Modelo)
            .MaximumLength(100).WithMessage("El campo modelo no debe superar los 100 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Modelo));

        RuleFor(x => x.NumeroSerie)
            .MaximumLength(100).WithMessage("El campo numero serie no debe superar los 100 caracteres.")
            .MustAsync(async (numeroSerie, ct) =>
                !await db.Activos.IgnoreQueryFilters()
                    .AnyAsync(a => a.NumeroSerie == numeroSerie, ct))
            .WithMessage("Ya existe un activo registrado con este número de serie.")
            .When(x => !string.IsNullOrWhiteSpace(x.NumeroSerie), ApplyConditionTo.AllValidators);

        RuleFor(x => x.CodigoInterno)
            .MaximumLength(50).WithMessage("El campo codigo interno no debe superar los 50 caracteres.")
            .MustAsync(async (cmd, codigoInterno, ct) =>
            {
                var idEmpresa = await db.Proveedores.IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(p => p.Id == cmd.IdProveedor)
                    .Select(p => (int?)p.IdEmpresa)
                    .FirstOrDefaultAsync(ct);
                if (idEmpresa is null)
                {
                    return true;
                }

                return !await db.Activos.IgnoreQueryFilters()
                    .AnyAsync(
                        a => a.CodigoInterno == codigoInterno
                            && db.Proveedores.IgnoreQueryFilters()
                                .Any(p => p.Id == a.IdProveedor && p.IdEmpresa == idEmpresa),
                        ct);
            })
            .WithMessage("Ya existe un activo con este código interno en la empresa.")
            .When(x => !string.IsNullOrWhiteSpace(x.CodigoInterno), ApplyConditionTo.AllValidators);

        RuleFor(x => x.EspecificacionesHardware)
            .MaximumLength(500).WithMessage("El campo especificaciones de hardware no debe superar los 500 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.EspecificacionesHardware));

        RuleFor(x => x.PerifericosAdicionales)
            .MaximumLength(500).WithMessage("El campo perifericos adicionales no debe superar los 500 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.PerifericosAdicionales));

        RuleFor(x => x.CostoAdquisicion)
            .GreaterThanOrEqualTo(0).WithMessage("El campo costo adquisicion debe ser mayor o igual a 0.");

        RuleFor(x => x.Moneda)
            .MaximumLength(10).WithMessage("El campo moneda no debe superar los 10 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Moneda));

        RuleFor(x => x.NumeroFactura)
            .MaximumLength(50).WithMessage("El campo numero factura no debe superar los 50 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.NumeroFactura));

        RuleFor(x => x.Observaciones)
            .MaximumLength(500).WithMessage("El campo observaciones no debe superar los 500 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));
    }
}

public sealed class CreateActivoCommandHandler : ICommandHandler<CreateActivoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateActivoCommand> _validator;

    public CreateActivoCommandHandler(IApplicationDbContext db, IValidator<CreateActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<Activo>();
        entity.TokenPublico = Guid.NewGuid().ToString("N")[..24];
        _db.Activos.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
