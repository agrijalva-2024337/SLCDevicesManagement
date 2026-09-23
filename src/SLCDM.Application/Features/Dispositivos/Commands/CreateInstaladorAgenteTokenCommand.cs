using FluentValidation;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;
using SLCDM.Domain.Entities;
using Microsoft.Extensions.Options;

namespace SLCDM.Application.Features.Dispositivos.Commands;

public sealed record CreateInstaladorAgenteTokenCommand();

public sealed class CreateInstaladorAgenteTokenCommandValidator
    : AbstractValidator<CreateInstaladorAgenteTokenCommand>
{
    public CreateInstaladorAgenteTokenCommandValidator()
    {
    }
}

public sealed record CreateInstaladorAgenteTokenResult(string Token, DateTime ExpiraEn);

public sealed class CreateInstaladorAgenteTokenCommandHandler
    : ICommandHandler<CreateInstaladorAgenteTokenCommand, CreateInstaladorAgenteTokenResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateInstaladorAgenteTokenCommand> _validator;
    private readonly ICurrentUserService _currentUser;
    private readonly AgentOptions _agentOptions;

    public CreateInstaladorAgenteTokenCommandHandler(
        IApplicationDbContext db,
        IValidator<CreateInstaladorAgenteTokenCommand> validator,
        ICurrentUserService currentUser,
        IOptions<AgentOptions> agentOptions)
    {
        _db = db;
        _validator = validator;
        _currentUser = currentUser;
        _agentOptions = agentOptions.Value;
    }

    public async Task<CreateInstaladorAgenteTokenResult> HandleAsync(
        CreateInstaladorAgenteTokenCommand command,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        if (_currentUser.UserId is not int idUsuario)
        {
            throw new ConflictException("No se pudo identificar al usuario que genera el link.");
        }

        var ahora = DateTime.UtcNow;
        var hours = _agentOptions.LinkExpiryHours > 0 ? _agentOptions.LinkExpiryHours : 24;
        var token = Guid.NewGuid().ToString("N")[..24];

        var entity = new InstaladorAgenteToken
        {
            Token = token,
            IdUsuarioCreador = idUsuario,
            CreadoEn = ahora,
            ExpiraEn = ahora.AddHours(hours),
            Revocado = false,
        };

        _db.InstaladoresAgenteToken.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new CreateInstaladorAgenteTokenResult(entity.Token, entity.ExpiraEn);
    }
}
