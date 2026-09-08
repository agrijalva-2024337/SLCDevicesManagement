namespace SLCDM.Application.Common.Interfaces;

public interface IAsignacionPdfService
{
    Task<Features.Asignaciones.AsignacionPdfFileDto> GenerarAsync(
        int idAsignacion, DateTime marcaTemporal, CancellationToken cancellationToken = default);
}