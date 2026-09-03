using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones.Commands;

public sealed record FinalizarMantenimientoCommand(
    int Id,
    string? TrabajoRealizado,
    decimal? Costo,
    string? NumeroFactura,
    DateTime? FechaDevolucion,
    string? Observaciones);

public sealed class FinalizarMantenimientoCommandValidator : AbstractValidator<FinalizarMantenimientoCommand>
{
    public FinalizarMantenimientoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id asignacion");

        RuleFor(x => x.TrabajoRealizado)
            .MaximumLength(300).WithMessage("El campo trabajo realizado no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.TrabajoRealizado));

        RuleFor(x => x.NumeroFactura)
            .MaximumLength(50).WithMessage("El campo numero factura no debe superar los 50 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.NumeroFactura));

        RuleFor(x => x.Costo)
            .GreaterThanOrEqualTo(0).WithMessage("El campo costo debe ser mayor o igual a 0.")
            .When(x => x.Costo.HasValue);

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));
    }
}

public sealed class FinalizarMantenimientoCommandHandler : ICommandHandler<FinalizarMantenimientoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<FinalizarMantenimientoCommand> _validator;

    public FinalizarMantenimientoCommandHandler(IApplicationDbContext db, IValidator<FinalizarMantenimientoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(FinalizarMantenimientoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Asignaciones.FirstOrDefaultAsync(a => a.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Asignacion", command.Id);

        var tipo = await _db.TiposAsignacion.AsNoTracking().FirstOrDefaultAsync(t => t.Id == entity.IdTipoAsignacion, cancellationToken);
        if (tipo is null || !TipoAsignacionNombres.EsNombre(tipo.Nombre, TipoAsignacionNombres.Mantenimiento))
        {
            throw new ConflictException("La asignacion indicada no corresponde a un mantenimiento.");
        }

        if (!entity.Activa)
        {
            throw new ConflictException("El mantenimiento ya esta cerrado.");
        }

        var detalle = await _db.DetallesMantenimiento.FirstOrDefaultAsync(d => d.IdAsignacion == entity.Id, cancellationToken)
            ?? throw new NotFoundException("DetalleMantenimiento", command.Id);

        if (command.TrabajoRealizado is not null)
        {
            detalle.TrabajoRealizado = command.TrabajoRealizado;
        }

        if (command.Costo is not null)
        {
            detalle.Costo = command.Costo;
        }

        if (command.NumeroFactura is not null)
        {
            detalle.NumeroFactura = command.NumeroFactura;
        }

        entity.Activa = false;
        entity.FechaDevolucion = command.FechaDevolucion is null || command.FechaDevolucion == default
            ? DateTime.UtcNow
            : command.FechaDevolucion;

        if (command.Observaciones is not null)
        {
            entity.Observaciones = command.Observaciones;
        }

        var activo = await _db.Activos.FirstOrDefaultAsync(a => a.Id == entity.IdActivo, cancellationToken);
        if (activo is not null)
        {
            var estadoDisponible = await EstadoActivoNombres.ObtenerRequeridoAsync(
                _db, EstadoActivoNombres.Disponible, cancellationToken);
            activo.IdEstado = estadoDisponible.Id;
        }

        await _db.SaveChangesAsync(cancellationToken);

        _db.HistorialActivos.Add(new HistorialActivo
        {
            IdAsignacion = entity.Id,
            FechaHora = DateTime.UtcNow,
            TipoOperacion = "Modificacion",
            Descripcion = "Cierre de mantenimiento",
            InformacionNueva = $"trabajo_realizado={command.TrabajoRealizado}; costo={command.Costo}; numero_factura={command.NumeroFactura}"
        });
        await _db.SaveChangesAsync(cancellationToken);
    }
}