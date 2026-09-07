namespace SLCDM.Application.Features.Consulta;

/// <summary>
/// Ficha publica al escanear el QR. Sin costos, sin numero de factura,
/// sin historial de movimientos -- solo lo minimo para identificar el
/// equipo y saber si esta disponible, asignado, en mantenimiento o de baja.
/// </summary>
public sealed record ConsultaActivoDto(
    int Id,
    string Nombre,
    string? Descripcion,
    string? Marca,
    string? Modelo,
    string? NumeroSerie,
    string? NombreCategoria,
    string? NombreEmpresa,
    string? NombreSede,
    string? NombreUbicacion,
    string? NombreArea,
    string? NombreResponsable,
    string EstadoOperativo,
    string EstadoNombre,
    DateTime? FechaVencimientoGarantia);
