namespace SLCDM.Application.Common.Interfaces;

public interface IAsignacionCorreoService
{
    Task NotificarResponsableAsync(int idAsignacion, CancellationToken cancellationToken = default);
}