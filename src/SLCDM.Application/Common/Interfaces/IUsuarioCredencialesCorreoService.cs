namespace SLCDM.Application.Common.Interfaces;

public interface IUsuarioCredencialesCorreoService
{
    Task EnviarCredencialesAsync(
        string correo,
        string nombres,
        string username,
        string password,
        CancellationToken cancellationToken = default);
}
