using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Usuarios;

public sealed class UsuarioCredencialesCorreoService : IUsuarioCredencialesCorreoService
{
    private readonly IEmailSender _email;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UsuarioCredencialesCorreoService> _logger;

    public UsuarioCredencialesCorreoService(
        IEmailSender email,
        IConfiguration configuration,
        ILogger<UsuarioCredencialesCorreoService> logger)
    {
        _email = email;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task EnviarCredencialesAsync(
        string correo,
        string nombres,
        string username,
        string password,
        CancellationToken cancellationToken = default)
    {
        var to = correo?.Trim();
        if (string.IsNullOrWhiteSpace(to) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("No se enviaron credenciales: correo o contraseña vacíos.");
            return;
        }

        try
        {
            var publicUrl = (_configuration["Frontend:PublicUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var loginUrl = $"{publicUrl}/login";
            var nombre = string.IsNullOrWhiteSpace(nombres) ? "usuario" : nombres.Trim();

            var cuerpo = $"""
                <p>Hola {Html(nombre)},</p>
                <p>Se creó su cuenta en <strong>SLC Devices Management</strong>. Estas son sus credenciales de acceso:</p>
                <ul>
                  <li><strong>Usuario:</strong> {Html(username)}</li>
                  <li><strong>Correo:</strong> {Html(to)}</li>
                  <li><strong>Contraseña:</strong> {Html(password)}</li>
                </ul>
                <p>Puede iniciar sesión con el usuario o el correo en <a href="{Html(loginUrl)}">{Html(loginUrl)}</a>.</p>
                <p>Le recomendamos cambiar la contraseña después del primer ingreso.</p>
                """;

            await _email.SendAsync(
                to,
                "Sus credenciales de SLC Devices Management",
                cuerpo,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudieron enviar las credenciales a {To}.", to);
        }
    }

    private static string Html(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
