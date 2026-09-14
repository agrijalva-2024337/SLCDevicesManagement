using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Features.Reportes;
using SLCDM.Application.Features.Reportes.Queries;

namespace SLCDM.Api.Controllers;

public sealed class ReportesController : ApiControllerBase
{
    private readonly IQueryHandler<GetInventarioGeneralQuery, IReadOnlyList<InventarioEmpresaResumenDto>> _inventario;
    private readonly IQueryHandler<GetActivosPorSedeQuery, IReadOnlyList<ActivosPorSedeDto>> _porSede;
    private readonly IQueryHandler<GetActivosPorCategoriaQuery, IReadOnlyList<ActivosPorCategoriaDto>> _porCategoria;
    private readonly IQueryHandler<GetActivosPorResponsableQuery, IReadOnlyList<ActivosPorResponsableDto>> _porResponsable;
    private readonly IQueryHandler<GetActivosReporteQuery, IReadOnlyList<ActivoReporteDto>> _activos;
    private readonly IQueryHandler<GetActivosPorUbicacionQuery, IReadOnlyList<ActivosPorUbicacionDto>> _porUbicacion;
    private readonly IQueryHandler<GetGarantiasPorVencerQuery, IReadOnlyList<GarantiaPorVencerDto>> _garantias;
    private readonly IQueryHandler<GetDiferenciasInventariosQuery, IReadOnlyList<DiferenciaInventarioReporteDto>> _diferencias;
    private readonly IQueryHandler<GetHistorialMovimientosQuery, IReadOnlyList<HistorialMovimientoReporteDto>> _historialMovimientos;
    private readonly IQueryHandler<GetHistorialAsignacionesReporteQuery, IReadOnlyList<HistorialAsignacionReporteDto>> _historialAsignaciones;
    private readonly IQueryHandler<GetHistorialMantenimientosReporteQuery, IReadOnlyList<HistorialMantenimientoReporteDto>> _historialMantenimientos;

    public ReportesController(
        IQueryHandler<GetInventarioGeneralQuery, IReadOnlyList<InventarioEmpresaResumenDto>> inventario,
        IQueryHandler<GetActivosPorSedeQuery, IReadOnlyList<ActivosPorSedeDto>> porSede,
        IQueryHandler<GetActivosPorCategoriaQuery, IReadOnlyList<ActivosPorCategoriaDto>> porCategoria,
        IQueryHandler<GetActivosPorResponsableQuery, IReadOnlyList<ActivosPorResponsableDto>> porResponsable,
        IQueryHandler<GetActivosReporteQuery, IReadOnlyList<ActivoReporteDto>> activos,
        IQueryHandler<GetActivosPorUbicacionQuery, IReadOnlyList<ActivosPorUbicacionDto>> porUbicacion,
        IQueryHandler<GetGarantiasPorVencerQuery, IReadOnlyList<GarantiaPorVencerDto>> garantias,
        IQueryHandler<GetDiferenciasInventariosQuery, IReadOnlyList<DiferenciaInventarioReporteDto>> diferencias,
        IQueryHandler<GetHistorialMovimientosQuery, IReadOnlyList<HistorialMovimientoReporteDto>> historialMovimientos,
        IQueryHandler<GetHistorialAsignacionesReporteQuery, IReadOnlyList<HistorialAsignacionReporteDto>> historialAsignaciones,
        IQueryHandler<GetHistorialMantenimientosReporteQuery, IReadOnlyList<HistorialMantenimientoReporteDto>> historialMantenimientos)
    {
        _inventario = inventario;
        _porSede = porSede;
        _porCategoria = porCategoria;
        _porResponsable = porResponsable;
        _activos = activos;
        _porUbicacion = porUbicacion;
        _garantias = garantias;
        _diferencias = diferencias;
        _historialMovimientos = historialMovimientos;
        _historialAsignaciones = historialAsignaciones;
        _historialMantenimientos = historialMantenimientos;
    }

    [HttpGet("inventario-general")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<InventarioEmpresaResumenDto>>> InventarioGeneral(
        [FromQuery] int? idEmpresa = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _inventario.HandleAsync(new GetInventarioGeneralQuery(idEmpresa), cancellationToken));

    [HttpGet("activos-por-sede")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivosPorSedeDto>>> ActivosPorSede(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] int? idSede = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _porSede.HandleAsync(new GetActivosPorSedeQuery(idEmpresa, idSede), cancellationToken));

    [HttpGet("activos-por-categoria")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivosPorCategoriaDto>>> ActivosPorCategoria(
        [FromQuery] int? idEmpresa = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _porCategoria.HandleAsync(new GetActivosPorCategoriaQuery(idEmpresa), cancellationToken));

    [HttpGet("activos-por-responsable")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivosPorResponsableDto>>> ActivosPorResponsable(
        [FromQuery] int? idEmpresa = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _porResponsable.HandleAsync(new GetActivosPorResponsableQuery(idEmpresa), cancellationToken));

    [HttpGet("activos")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivoReporteDto>>> Activos(
        [FromQuery] string? estado = null,
        [FromQuery] int? idEmpresa = null,
        [FromQuery] int? idSede = null,
        [FromQuery] int? idCategoriaActivo = null,
        [FromQuery] int? idResponsable = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100,
        CancellationToken cancellationToken = default) =>
        Ok(await _activos.HandleAsync(
            new GetActivosReporteQuery(estado, idEmpresa, idSede, idCategoriaActivo, idResponsable, skip, take),
            cancellationToken));

    [HttpGet("activos-por-ubicacion")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<ActivosPorUbicacionDto>>> ActivosPorUbicacion(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] int? idSede = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _porUbicacion.HandleAsync(new GetActivosPorUbicacionQuery(idEmpresa, idSede), cancellationToken));

    [HttpGet("garantias-por-vencer")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<GarantiaPorVencerDto>>> GarantiasPorVencer(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] int dias = 30,
        CancellationToken cancellationToken = default) =>
        Ok(await _garantias.HandleAsync(new GetGarantiasPorVencerQuery(idEmpresa, dias), cancellationToken));

    [HttpGet("diferencias-inventario")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<DiferenciaInventarioReporteDto>>> DiferenciasInventario(
        [FromQuery] int? idEmpresa = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _diferencias.HandleAsync(new GetDiferenciasInventariosQuery(idEmpresa), cancellationToken));

    [HttpGet("historial-movimientos")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<HistorialMovimientoReporteDto>>> HistorialMovimientos(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _historialMovimientos.HandleAsync(
            new GetHistorialMovimientosQuery(idEmpresa, fechaDesde, fechaHasta),
            cancellationToken));

    [HttpGet("historial-asignaciones")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<HistorialAsignacionReporteDto>>> HistorialAsignaciones(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _historialAsignaciones.HandleAsync(
            new GetHistorialAsignacionesReporteQuery(idEmpresa, fechaDesde, fechaHasta),
            cancellationToken));

    [HttpGet("historial-mantenimientos")]
    [Authorize(Roles = Roles.Lectura)]
    public async Task<ActionResult<IReadOnlyList<HistorialMantenimientoReporteDto>>> HistorialMantenimientos(
        [FromQuery] int? idEmpresa = null,
        [FromQuery] DateTime? fechaDesde = null,
        [FromQuery] DateTime? fechaHasta = null,
        CancellationToken cancellationToken = default) =>
        Ok(await _historialMantenimientos.HandleAsync(
            new GetHistorialMantenimientosReporteQuery(idEmpresa, fechaDesde, fechaHasta),
            cancellationToken));
}
