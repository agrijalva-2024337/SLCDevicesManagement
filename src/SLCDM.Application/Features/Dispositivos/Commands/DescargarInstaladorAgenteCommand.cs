using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;

namespace SLCDM.Application.Features.Dispositivos.Commands;

/// <param name="RequestBaseUrl">Host del request (scheme://host) si no hay URL en config.</param>
public sealed record DescargarInstaladorAgenteCommand(string Token, string? RequestBaseUrl = null);

public sealed record InstaladorAgenteZipDto(byte[] Content, string FileName);

/// <summary>
/// Arma el ZIP del instalador (exe + appsettings prellenado + Activar.bat).
/// Nota: el .exe en <see cref="AgentOptions.PublishedExePath"/> se actualiza a mano
/// con `dotnet publish` del proyecto agent — no hay build automático en esta feature.
/// </summary>
public sealed class DescargarInstaladorAgenteCommandHandler
    : ICommandHandler<DescargarInstaladorAgenteCommand, InstaladorAgenteZipDto>
{
    private readonly IApplicationDbContext _db;
    private readonly AgentOptions _agentOptions;
    private readonly DeviceTrackingOptions _deviceTracking;

    public DescargarInstaladorAgenteCommandHandler(
        IApplicationDbContext db,
        IOptions<AgentOptions> agentOptions,
        IOptions<DeviceTrackingOptions> deviceTracking)
    {
        _db = db;
        _agentOptions = agentOptions.Value;
        _deviceTracking = deviceTracking.Value;
    }

    public async Task<InstaladorAgenteZipDto> HandleAsync(
        DescargarInstaladorAgenteCommand command,
        CancellationToken cancellationToken = default)
    {
        var token = string.IsNullOrWhiteSpace(command.Token) ? null : command.Token.Trim();
        if (token is null)
        {
            throw new NotFoundException("Instalador", command.Token);
        }

        var entity = await _db.InstaladoresAgenteToken
            .FirstOrDefaultAsync(t => t.Token == token, cancellationToken);

        // Misma respuesta opaca (404) si no existe, venció o está revocado.
        if (entity is null
            || entity.Revocado
            || entity.ExpiraEn < DateTime.UtcNow)
        {
            throw new NotFoundException("Instalador", token);
        }

        var exePath = _agentOptions.PublishedExePath;
        if (string.IsNullOrWhiteSpace(exePath) || !File.Exists(exePath))
        {
            throw new ConflictException(
                "El paquete del agente no está disponible en el servidor. Contacte a un administrador.");
        }

        var backendUrl = ResolveBackendPublicUrl(command.RequestBaseUrl).TrimEnd('/');
        if (string.IsNullOrWhiteSpace(backendUrl))
        {
            throw new ConflictException(
                "Falta Agent:BackendPublicUrl (o DownloadBaseUrl) para empaquetar el instalador.");
        }

        if (string.IsNullOrWhiteSpace(_deviceTracking.InstallKey))
        {
            throw new ConflictException("Falta DeviceTracking:InstallKey en la configuración del servidor.");
        }

        var appsettingsJson = JsonSerializer.Serialize(
            new
            {
                Backend = new
                {
                    BaseUrl = backendUrl,
                    InstallKey = _deviceTracking.InstallKey,
                },
            },
            new JsonSerializerOptions { WriteIndented = true });

        var exeBytes = await File.ReadAllBytesAsync(exePath, cancellationToken);
        var zipBytes = BuildZip(exeBytes, appsettingsJson);

        entity.UsadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return new InstaladorAgenteZipDto(zipBytes, "SLCDM-Agente-Instalador.zip");
    }

    private string ResolveBackendPublicUrl(string? requestBaseUrl)
    {
        if (!string.IsNullOrWhiteSpace(_agentOptions.BackendPublicUrl))
        {
            return _agentOptions.BackendPublicUrl;
        }

        if (!string.IsNullOrWhiteSpace(_agentOptions.DownloadBaseUrl))
        {
            return _agentOptions.DownloadBaseUrl;
        }

        return requestBaseUrl ?? string.Empty;
    }

    private static byte[] BuildZip(byte[] exeBytes, string appsettingsJson)
    {
        using var memory = new MemoryStream();
        using (var archive = new ZipArchive(memory, ZipArchiveMode.Create, leaveOpen: true))
        {
            var exeEntry = archive.CreateEntry("SLCDMAgente.exe", CompressionLevel.Optimal);
            using (var stream = exeEntry.Open())
            {
                stream.Write(exeBytes);
            }

            var settingsEntry = archive.CreateEntry("appsettings.Production.json", CompressionLevel.Optimal);
            using (var stream = settingsEntry.Open())
            {
                var bytes = Encoding.UTF8.GetBytes(appsettingsJson);
                stream.Write(bytes);
            }

            // Tarea 64: el flag --instalar hará que el .exe se registre solo.
            var batEntry = archive.CreateEntry("Activar.bat", CompressionLevel.Optimal);
            using (var stream = batEntry.Open())
            {
                var bytes = Encoding.ASCII.GetBytes("SLCDMAgente.exe --instalar\r\n");
                stream.Write(bytes);
            }
        }

        return memory.ToArray();
    }
}
