using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.MotivosBaja;
using SLCDM.Application.Features.MotivosBaja.Queries;

namespace SLCDM.Api.Controllers;

public sealed class MotivosBajaController : ApiControllerBase
{
    private readonly IQueryHandler<GetMotivosBajaQuery, IReadOnlyList<MotivoBajaDto>> _getAll;
    private readonly IQueryHandler<GetMotivoBajaByIdQuery, MotivoBajaDto> _getById;

    public MotivosBajaController(
        IQueryHandler<GetMotivosBajaQuery, IReadOnlyList<MotivoBajaDto>> getAll,
        IQueryHandler<GetMotivoBajaByIdQuery, MotivoBajaDto> getById)
    {
        _getAll = getAll;
        _getById = getById;
    }

    [HttpGet]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<MotivoBajaDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await _getAll.HandleAsync(new GetMotivosBajaQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<MotivoBajaDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await _getById.HandleAsync(new GetMotivoBajaByIdQuery(id), cancellationToken));
}
