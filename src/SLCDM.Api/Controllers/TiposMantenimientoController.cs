using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.TiposMantenimiento;
using SLCDM.Application.Features.TiposMantenimiento.Commands;
using SLCDM.Application.Features.TiposMantenimiento.Queries;

namespace SLCDM.Api.Controllers;

public sealed class TiposMantenimientoController : ApiControllerBase
{
    private readonly IQueryHandler<GetTiposMantenimientoQuery, IReadOnlyList<TipoMantenimientoDto>> _getAll;
    private readonly IQueryHandler<GetTipoMantenimientoByIdQuery, TipoMantenimientoDto> _getById;
    private readonly ICommandHandler<CreateTipoMantenimientoCommand, int> _create;
    private readonly ICommandHandler<UpdateTipoMantenimientoCommand> _update;
    private readonly ICommandHandler<DeleteTipoMantenimientoCommand> _delete;

    public TiposMantenimientoController(
        IQueryHandler<GetTiposMantenimientoQuery, IReadOnlyList<TipoMantenimientoDto>> getAll,
        IQueryHandler<GetTipoMantenimientoByIdQuery, TipoMantenimientoDto> getById,
        ICommandHandler<CreateTipoMantenimientoCommand, int> create,
        ICommandHandler<UpdateTipoMantenimientoCommand> update,
        ICommandHandler<DeleteTipoMantenimientoCommand> delete)
    {
        _getAll = getAll;
        _getById = getById;
        _create = create;
        _update = update;
        _delete = delete;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<TipoMantenimientoDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await _getAll.HandleAsync(new GetTiposMantenimientoQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<TipoMantenimientoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetTipoMantenimientoByIdQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Create(
        [FromBody] CreateTipoMantenimientoCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _create.HandleAsync(command, cancellationToken);
        return CreatedId(nameof(GetById), id);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateTipoMantenimientoCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id) return IdMismatch();
        await _update.HandleAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.EscrituraEmpresa)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _delete.HandleAsync(new DeleteTipoMantenimientoCommand(id), cancellationToken);
        return NoContent();
    }
}
