using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.DetallesActivos.Commands;

public sealed record DeleteDetalleActivoCommand(int Id);

public sealed class DeleteDetalleActivoCommandValidator : AbstractValidator<DeleteDetalleActivoCommand>
{
    public DeleteDetalleActivoCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id detalle activo");
    }
}

public sealed class DeleteDetalleActivoCommandHandler : ICommandHandler<DeleteDetalleActivoCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<DeleteDetalleActivoCommand> _validator;

    public DeleteDetalleActivoCommandHandler(
        IApplicationDbContext db, IValidator<DeleteDetalleActivoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(DeleteDetalleActivoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.DetallesActivos.FirstOrDefaultAsync(d => d.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("DetalleActivo", command.Id);

        var jornada = await _db.HistoricosInventario.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == entity.IdHistoricoInventario, cancellationToken);

        if (jornada is not null && jornada.Cerrado)
        {
            throw new ConflictException("La jornada de inventario ya esta cerrada. No se puede eliminar el hallazgo.");
        }
        
        var historial = await _db.HistorialActivos
            .Where(h => h.IdDetalleActivo == entity.Id)
            .ToListAsync(cancellationToken);
        _db.HistorialActivos.RemoveRange(historial);

        _db.DetallesActivos.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }
}