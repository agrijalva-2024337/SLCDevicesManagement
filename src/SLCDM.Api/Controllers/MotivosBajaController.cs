using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.MotivosBaja;
using SLCDM.Application.Features.MotivosBaja.Commands;
using SLCDM.Application.Features.MotivosBaja.Queries;

namespace SLCDM.Api.Controllers;

public sealed class MotivosBajaController : ApiControllerBase
{
    private readonly IQueryHandler<GetMotivosBajaQuery, IReadOnlyList<MotivoBajaDto>> _getAll;
    private readonly IQueryHandler<GetMotivoBajaByIdQuery, MotivoBajaDto> _getById;
    private readonly ICommandHandler<CreateMotivoBajaCommand, int> _create;
    private readonly ICommandHandler<UpdateMotivoBajaCommand> _update;
    private readonly ICommandHandler<DeleteMotivoBajaCommand> _delete;

    public MotivosBajaController(
        IQueryHandler<GetMotivosBajaQuery, IReadOnlyList<MotivoBajaDto>> getAll,
        IQueryHandler<GetMotivoBajaByIdQuery, MotivoBajaDto> getById,
        ICommandHandler<CreateMotivoBajaCommand, int> create,
        ICommandHandler<UpdateMotivoBajaCommand> update,
        ICommandHandler<DeleteMotivoBajaCommand> delete)
    {
        _getAll = getAll;
        _getById = getById;
        _create = create;
        _update = update;
        _delete = delete;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<MotivoBajaDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await _getAll.HandleAsync(new GetMotivosBajaQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<MotivoBajaDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetMotivoBajaByIdQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Create([FromBody] CreateMotivoBajaCommand command, CancellationToken cancellationToken)
    {
        var id = await _create.HandleAsync(command, cancellationToken);
        return CreatedId(nameof(GetById), id);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMotivoBajaCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id) return IdMismatch();
        await _update.HandleAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _delete.HandleAsync(new DeleteMotivoBajaCommand(id), cancellationToken);
        return NoContent();
    }
}
