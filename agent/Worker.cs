using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.RegularExpressions;

namespace SLCDM.Agent;

public sealed class Worker : BackgroundService
{
    private readonly HttpClient _http;
    private readonly string _installKey;
    private static readonly TimeSpan Intervalo = TimeSpan.FromMinutes(15);

    public Worker(HttpClient http, string installKey)
    {
        _http = http;
        _installKey = installKey;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var token = CredencialAlmacen.LeerToken();

        if (token is null)
        {
            token = await AutoRegistrarseAsync(stoppingToken);
            CredencialAlmacen.GuardarToken(token);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var bssid = ObtenerBssidConectado();
            if (bssid is not null)
            {
                await EnviarPingAsync(token, bssid, stoppingToken);
            }

            await Task.Delay(Intervalo, stoppingToken);
        }
    }

    private async Task<string> AutoRegistrarseAsync(CancellationToken cancellationToken)
    {
        var numeroSerie = HuellaHardware.LeerNumeroSerieBios()
            ?? throw new InvalidOperationException("No se pudo leer el numero de serie del equipo.");

        var response = await _http.PostAsJsonAsync("api/dispositivos/auto-registro", new
        {
            NumeroSerie = numeroSerie,
            InstallKey = _installKey
        }, cancellationToken);

        response.EnsureSuccessStatusCode();

        var dto = await response.Content.ReadFromJsonAsync<RespuestaAutoRegistro>(cancellationToken: cancellationToken);
        return dto!.TokenCrudo;
    }

    private static string? ObtenerBssidConectado()
    {
        var psi = new ProcessStartInfo("netsh", "wlan show interfaces")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var proceso = Process.Start(psi);
        if (proceso is null)
        {
            return null;
        }

        var salida = proceso.StandardOutput.ReadToEnd();
        proceso.WaitForExit();

        var match = Regex.Match(salida, @"BSSID\s*:\s*([0-9a-fA-F:]{17})");
        return match.Success ? match.Groups[1].Value.ToLowerInvariant() : null;
    }

    private async Task EnviarPingAsync(string token, string bssid, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/dispositivos/ping");
        request.Headers.Add("X-Device-Token", token);
        request.Content = JsonContent.Create(new { Bssid = bssid });

        try
        {
            using var response = await _http.SendAsync(request, cancellationToken);
        }
        catch
        {
            // Sin conexion al backend: se reintenta en el siguiente ciclo.
            // No se detiene el servicio por un fallo de red puntual.
        }
    }

    private sealed record RespuestaAutoRegistro(int Id, int IdActivo, string TokenCrudo, DateTime CreadoEn, DateTime? ExpiraEn);
}
