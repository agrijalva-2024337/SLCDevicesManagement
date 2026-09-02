using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.DetallesActivos;
using SLCDM.Application.Features.DetallesActivos.Queries;

namespace SLCDM.Api.Controllers;

public sealed class DetallesActivosController : ApiControllerBase
{
    private readonly IQueryHandler<GetDetallesActivosQuery, IReadOnlyList<DetalleActivoDto>> _getAll;
    private readonly IQueryHandler<GetDetalleActivoByIdQuery, DetalleActivoDto> _getById;

    public DetallesActivosController(
        IQueryHandler<GetDetallesActivosQuery, IReadOnlyList<DetalleActivoDto>> getAll,
        IQueryHandler<GetDetalleActivoByIdQuery, DetalleActivoDto> getById)
    {
        _getAll = getAll;
        _getById = getById;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<DetalleActivoDto>>> GetAll(
        [FromQuery] int? idHistoricoInventario = null,
        [FromQuery] int? idActivo = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _getAll.HandleAsync(new GetDetallesActivosQuery(idHistoricoInventario, idActivo), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<DetalleActivoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetDetalleActivoByIdQuery(id), cancellationToken));

    // ---- BE-21 (Sprint 8): Create/Update/Delete, cuando exista la regla
    // de "no editar si la jornada esta cerrada" ----
}