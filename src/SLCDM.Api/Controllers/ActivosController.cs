using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.Activos;
using SLCDM.Application.Features.Activos.Commands;
using SLCDM.Application.Features.Asignaciones.Queries;
using SLCDM.Application.Features.Activos.Queries;
using SLCDM.Application.Features.Asignaciones;
using SLCDM.Application.Features.HistorialActivos.Queries;

namespace SLCDM.Api.Controllers;

public sealed class ActivosController : ApiControllerBase
{
    private readonly IQueryHandler<GetActivosQuery, IReadOnlyList<ActivoDto>> _getAll;
    private readonly IQueryHandler<GetActivoByIdQuery, ActivoDto> _getById;
    private readonly ICommandHandler<CreateActivoCommand, int> _create;
    private readonly ICommandHandler<UpdateActivoCommand> _update;
    private readonly ICommandHandler<DisableActivoCommand> _disable;
    private readonly ICommandHandler<EnableActivoCommand> _enable;
    private readonly IQueryHandler<GetActivoQrQuery, ActivoQrFileDto> _qr;

    public ActivosController(
        IQueryHandler<GetActivosQuery, IReadOnlyList<ActivoDto>> getAll,
        IQueryHandler<GetActivoByIdQuery, ActivoDto> getById,
        ICommandHandler<CreateActivoCommand, int> create,
        ICommandHandler<UpdateActivoCommand> update,
        ICommandHandler<DisableActivoCommand> disable,
        ICommandHandler<EnableActivoCommand> enable,
        IQueryHandler<GetActivoQrQuery, ActivoQrFileDto> qr)
    {
        _getAll = getAll;
        _getById = getById;
        _create = create;
        _update = update;
        _disable = disable;
        _enable = enable;
        _qr = qr;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivoDto>>> GetAll(
        [FromQuery] int? idCategoriaActivo = null,
        [FromQuery] int? idProveedor = null,
        [FromQuery] int? idUbicacion = null,
        [FromQuery] bool incluirInhabilitados = false,
        CancellationToken cancellationToken = default) =>
        Ok(await _getAll.HandleAsync(
            new GetActivosQuery(idCategoriaActivo, idProveedor, idUbicacion, incluirInhabilitados),
            cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<ActivoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetActivoByIdQuery(id), cancellationToken));

    [HttpGet("{id:int}/qr")]
    [Authorize(Roles = Roles.Lectura)]
    [Produces("image/png")]
    public async Task<IActionResult> GetQr(int id, CancellationToken cancellationToken)
    {
        var file = await _qr.HandleAsync(new GetActivoQrQuery(id), cancellationToken);
        return File(file.Content, "image/png", file.FileName);
    }

    [HttpGet("{id:int}/asignaciones")]
    [Authorize(Roles = Roles.Lectura)]
    [ProducesResponseType(typeof(IReadOnlyList<AsignacionHistorialDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AsignacionHistorialDto>>> GetHistorialAsignaciones(
        int id,
        [FromServices] IQueryHandler<GetHistorialAsignacionesPorActivoQuery, IReadOnlyList<AsignacionHistorialDto>> historial,
        CancellationToken cancellationToken) =>
        Ok(await historial.HandleAsync(new GetHistorialAsignacionesPorActivoQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Create([FromBody] CreateActivoCommand command, CancellationToken cancellationToken)
    {
        var id = await _create.HandleAsync(command, cancellationToken);
        return CreatedId(nameof(GetById), id);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateActivoCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id) return IdMismatch();
        await _update.HandleAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/disable")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Disable(int id, CancellationToken cancellationToken)
    {
        await _disable.HandleAsync(new DisableActivoCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/enable")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Enable(int id, CancellationToken cancellationToken)
    {
        await _enable.HandleAsync(new EnableActivoCommand(id), cancellationToken);
        return NoContent();
    }
}
