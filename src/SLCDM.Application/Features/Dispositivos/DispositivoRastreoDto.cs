namespace SLCDM.Application.Features.Dispositivos;

public sealed record DispositivoRastreoDto(
    int Id,
    int IdActivo,
    string NombreActivo,
    int? IdUbicacionAsignada,
    int? IdUbicacionDetectada,
    DateTime? UltimoUsoEn,
    bool FueraDeRango,
    bool Revocado,
    DateTime CreadoEn,
    DateTime? ExpiraEn);
