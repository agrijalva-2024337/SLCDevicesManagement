using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.TiposMantenimiento;
using SLCDM.Application.Features.TiposMantenimiento.Queries;

namespace SLCDM.Api.Controllers;

public sealed class TiposMantenimientoController : ApiControllerBase
{
    private readonly IQueryHandler<GetTiposMantenimientoQuery, IReadOnlyList<TipoMantenimientoDto>> _getAll;
    private readonly IQueryHandler<GetTipoMantenimientoByIdQuery, TipoMantenimientoDto> _getById;

    public TiposMantenimientoController(
        IQueryHandler<GetTiposMantenimientoQuery, IReadOnlyList<TipoMantenimientoDto>> getAll,
        IQueryHandler<GetTipoMantenimientoByIdQuery, TipoMantenimientoDto> getById)
    {
        _getAll = getAll;
        _getById = getById;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<TipoMantenimientoDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await _getAll.HandleAsync(new GetTiposMantenimientoQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<TipoMantenimientoDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetTipoMantenimientoByIdQuery(id), cancellationToken));
}
