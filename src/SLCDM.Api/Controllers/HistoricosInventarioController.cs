using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.HistoricosInventario;
using SLCDM.Application.Features.HistoricosInventario.Commands;
using SLCDM.Application.Features.HistoricosInventario.Queries;

namespace SLCDM.Api.Controllers;

public sealed class HistoricosInventarioController : ApiControllerBase
{
    private readonly IQueryHandler<GetHistoricosInventarioQuery, IReadOnlyList<HistoricoInventarioDto>> _getAll;
    private readonly IQueryHandler<GetHistoricoInventarioByIdQuery, HistoricoInventarioDto> _getById;
    private readonly IQueryHandler<GetDiferenciasInventarioQuery, IReadOnlyList<DiferenciaInventarioDto>> _getDiferencias;
    private readonly ICommandHandler<CreateHistoricoInventarioCommand, int> _create;
    private readonly ICommandHandler<CerrarHistoricoInventarioCommand> _cerrar;

    public HistoricosInventarioController(
        IQueryHandler<GetHistoricosInventarioQuery, IReadOnlyList<HistoricoInventarioDto>> getAll,
        IQueryHandler<GetHistoricoInventarioByIdQuery, HistoricoInventarioDto> getById,
        IQueryHandler<GetDiferenciasInventarioQuery, IReadOnlyList<DiferenciaInventarioDto>> getDiferencias,
        ICommandHandler<CreateHistoricoInventarioCommand, int> create,
        ICommandHandler<CerrarHistoricoInventarioCommand> cerrar)
    {
        _getAll = getAll;
        _getById = getById;
        _getDiferencias = getDiferencias;
        _create = create;
        _cerrar = cerrar;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<HistoricoInventarioDto>>> GetAll(
        [FromQuery] int? idSede = null,
        [FromQuery] int? idEmpresa = null,
        [FromQuery] bool? soloAbiertos = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _getAll.HandleAsync(
            new GetHistoricosInventarioQuery(idSede, idEmpresa, soloAbiertos),
            cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<HistoricoInventarioDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetHistoricoInventarioByIdQuery(id), cancellationToken));

    [HttpGet("{id:int}/diferencias")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<DiferenciaInventarioDto>>> GetDiferencias(
        int id, CancellationToken cancellationToken) =>
        Ok(await _getDiferencias.HandleAsync(new GetDiferenciasInventarioQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Create(
        [FromBody] CreateHistoricoInventarioCommand command,
        CancellationToken cancellationToken)
    {
        var id = await _create.HandleAsync(command, cancellationToken);
        return CreatedId(nameof(GetById), id);
    }

    [HttpPost("{id:int}/cerrar")]
    [Authorize(Roles = Roles.EscrituraOperativa)]
    public async Task<IActionResult> Cerrar(
        int id,
        [FromQuery] DateTime? fechaCierre = null,
        CancellationToken cancellationToken = default)
    {
        await _cerrar.HandleAsync(new CerrarHistoricoInventarioCommand(id, fechaCierre), cancellationToken);
        return NoContent();
    }
}