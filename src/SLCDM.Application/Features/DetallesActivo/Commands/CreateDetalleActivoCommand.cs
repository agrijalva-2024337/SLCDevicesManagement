using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.DetallesActivos.Commands;

public sealed record CreateDetalleActivoCommand(
    int IdActivo,
    int IdHistoricoInventario,
    bool Encontrado,
    bool BuenEstado,
    string? Observaciones,
    DateTime FechaVerificacion);

public sealed class CreateDetalleActivoCommandValidator : AbstractValidator<CreateDetalleActivoCommand>
{
    public CreateDetalleActivoCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdActivo)
            .RequiredId("id activo")
            .MustAsync(async (id, ct) => await db.Activos.AnyAsync(a => a.Id == id, ct))
            .WithMessage("No se encontro un activo con el id informado.");

        RuleFor(x => x.IdHistoricoInventario)
            .RequiredId("id historico inventario")
            .MustAsync(async (id, ct) => await db.HistoricosInventario.AnyAsync(h => h.Id == id, ct))
            .WithMessage("No se encontro una jornada de inventario con el id informado.")
            .MustAsync(async (id, ct) =>
            {
                var jornada = await db.HistoricosInventario.AsNoTracking()
                    .FirstOrDefaultAsync(h => h.Id == id, ct);
                return jornada is null || !jornada.Cerrado;
            })
            .WithMessage("La jornada de inventario ya esta cerrada. No se pueden registrar nuevos hallazgos.");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) => !await db.DetallesActivos.AnyAsync(
                d => d.IdActivo == cmd.IdActivo && d.IdHistoricoInventario == cmd.IdHistoricoInventario, ct))
            .WithMessage("Este activo ya fue verificado en esta jornada de inventario.")
            .WithName("IdActivo");

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));
    }
}

public sealed class CreateDetalleActivoCommandHandler : ICommandHandler<CreateDetalleActivoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateDetalleActivoCommand> _validator;

    public CreateDetalleActivoCommandHandler(
        IApplicationDbContext db, IValidator<CreateDetalleActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(
        CreateDetalleActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = command.Adapt<DetalleActivo>();
        if (entity.FechaVerificacion == default)
        {
            entity.FechaVerificacion = DateTime.UtcNow;
        }

        _db.DetallesActivos.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        // ck_historial_activo_una_sola_fuente exige exactamente una de las dos FK:
        // aca va IdDetalleActivo, nunca IdAsignacion.
        _db.HistorialActivos.Add(new HistorialActivo
        {
            IdDetalleActivo = entity.Id,
            FechaHora = DateTime.UtcNow,
            TipoOperacion = "Verificacion",
            Descripcion = $"Verificacion de inventario fisico (jornada {command.IdHistoricoInventario})",
            InformacionNueva =
                $"id_activo={command.IdActivo}; encontrado={command.Encontrado}; buen_estado={command.BuenEstado}"
        });
        await _db.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}