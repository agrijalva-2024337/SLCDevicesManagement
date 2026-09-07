namespace SLCDM.Application.Features.Dispositivos;

public sealed record UbicacionMapaDto(int Id, string Nombre, decimal Latitud, decimal Longitud);

public sealed record DispositivoRastreoDto(
    int Id,
    int IdActivo,
    string NombreActivo,
    bool FueraDeRango,
    DateTime? UltimoUsoEn,
    string? UltimoBssid,
    string? OrigenCoordenada,
    decimal? UltimaLatitud,
    decimal? UltimaLongitud,
    UbicacionMapaDto? UbicacionAsignada,
    UbicacionMapaDto? UbicacionDetectada);