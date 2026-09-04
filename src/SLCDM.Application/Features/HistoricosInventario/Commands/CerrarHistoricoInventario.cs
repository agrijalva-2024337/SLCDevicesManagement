using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.HistoricosInventario.Commands;

public sealed record CerrarHistoricoInventarioCommand(int Id, DateTime? FechaCierre);

public sealed class CerrarHistoricoInventarioCommandValidator : AbstractValidator<CerrarHistoricoInventarioCommand>
{
    public CerrarHistoricoInventarioCommandValidator()
    {
        RuleFor(x => x.Id).RequiredId("id historico inventario");
    }
}

public sealed class CerrarHistoricoInventarioCommandHandler : ICommandHandler<CerrarHistoricoInventarioCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CerrarHistoricoInventarioCommand> _validator;

    public CerrarHistoricoInventarioCommandHandler(
        IApplicationDbContext db,
        IValidator<CerrarHistoricoInventarioCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task HandleAsync(
        CerrarHistoricoInventarioCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.HistoricosInventario
            .FirstOrDefaultAsync(h => h.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("HistoricoInventario", command.Id);

        if (entity.Cerrado)
        {
            throw new ConflictException("La jornada de inventario ya esta cerrada.");
        }

        entity.Cerrado = true;
        entity.FechaCierre = command.FechaCierre ?? DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
    }
}