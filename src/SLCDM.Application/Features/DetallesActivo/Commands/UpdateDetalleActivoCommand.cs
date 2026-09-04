using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.DetallesActivos.Commands;

public sealed record UpdateDetalleActivoCommand(
    int Id,
    bool Encontrado,
    bool BuenEstado,
    string? Observaciones);

public sealed class UpdateDetalleActivoCommandValidator : AbstractValidator<UpdateDetalleActivoCommand>
{
    public UpdateDetalleActivoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id detalle activo");

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));
    }
}

public sealed class UpdateDetalleActivoCommandHandler : ICommandHandler<UpdateDetalleActivoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<UpdateDetalleActivoCommand> _validator;

    public UpdateDetalleActivoCommandHandler(
        IApplicationDbContext db, IValidator<UpdateDetalleActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateDetalleActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.DetallesActivos.FirstOrDefaultAsync(d => d.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("DetalleActivo", command.Id);

        var jornada = await _db.HistoricosInventario.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == entity.IdHistoricoInventario, cancellationToken);

        if (jornada is not null && jornada.Cerrado)
        {
            throw new ConflictException("La jornada de inventario ya esta cerrada. No se puede editar el hallazgo.");
        }

        entity.Encontrado = command.Encontrado;
        entity.BuenEstado = command.BuenEstado;
        entity.Observaciones = command.Observaciones;

        await _db.SaveChangesAsync(cancellationToken);
    }
}