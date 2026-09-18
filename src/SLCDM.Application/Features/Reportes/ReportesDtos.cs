using SLCDM.Domain.Entities;
namespace SLCDM.Application.Features.Reportes;

public sealed record InventarioEmpresaResumenDto(
    int IdEmpresa,
    string NombreEmpresa,
    int TotalActivos,
    int Disponibles,
    int Asignados,
    int EnMantenimiento,
    int DadosDeBaja,
    IReadOnlyList<CostoPorMonedaDto> CostosPorMoneda);

public sealed record CostoPorMonedaDto(string Moneda, decimal Total);

public sealed record ActivosPorSedeDto(
    int IdSede,
    string NombreSede,
    int IdEmpresa,
    int TotalActivos,
    int Disponibles,
    int Asignados,
    int EnMantenimiento,
    int DadosDeBaja);

public sealed record ActivosPorUbicacionDto(
    int IdUbicacion,
    string NombreUbicacion,
    int IdSede,
    string NombreSede,
    int IdEmpresa,
    int TotalActivos,
    int Disponibles,
    int Asignados,
    int EnMantenimiento,
    int DadosDeBaja);

public sealed record ActivosPorCategoriaDto(
    int IdCategoriaActivo,
    string NombreCategoria,
    int TotalActivos,
    int Disponibles,
    int Asignados,
    int EnMantenimiento,
    int DadosDeBaja);

public sealed record ActivosPorResponsableDto(
    int IdResponsable,
    string NombreResponsable,
    int TotalAsignados);

public sealed record ActivoReporteDto(
    Activos.ActivoDto Activo,
    string EstadoOperativo,
    int IdSede,
    string NombreSede,
    int? IdResponsable);

public sealed record GarantiaPorVencerDto(
    Activos.ActivoDto Activo,
    DateTime FechaVencimientoGarantia,
    int DiasRestantes,
    int IdSede,
    string NombreSede);

public sealed record HistorialMovimientoReporteDto(
    int Id,
    int IdActivo,
    string NombreActivo,
    string? NumeroSerie,
    DateTime FechaHora,
    string? TipoOperacion,
    string? Descripcion,
    string? InformacionAnterior,
    string? InformacionNueva,
    int IdEmpresa,
    string NombreEmpresa);

public sealed record HistorialAsignacionReporteDto(
    int Id,
    int IdActivo,
    string NombreActivo,
    string? NumeroSerie,
    int IdResponsable,
    string NombreResponsable,
    int IdTipoAsignacion,
    string TipoAsignacion,
    DateTime FechaAsignacion,
    DateTime? FechaDevolucion,
    bool Activa,
    string? Observaciones,
    int IdEmpresa,
    string NombreEmpresa);

public sealed record HistorialMantenimientoReporteDto(
    int Id,
    int IdAsignacion,
    int IdActivo,
    string NombreActivo,
    string? NumeroSerie,
    int IdResponsable,
    string NombreResponsable,
    int? IdProveedor,
    string? NombreProveedor,
    int IdTipoMantenimiento,
    string TipoMantenimiento,
    string DescripcionProblema,
    string? TrabajoRealizado,
    decimal? Costo,
    string? NumeroFactura,
    DateTime FechaInicio,
    DateTime? FechaFin,
    bool ActivoEnCurso,
    int IdEmpresa,
    string NombreEmpresa);
