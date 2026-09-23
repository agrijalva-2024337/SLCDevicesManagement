namespace SLCDM.Application.Common.Options;

/// <summary>
/// Configuración del paquete descargable del agente de rastreo.
/// Mantener el .exe actualizado republicando el agente
/// (`dotnet publish agent/SLCDM.Agent.csproj -c Release -r win-x64 --self-contained true -o agent/publish`)
/// cada vez que cambie el código del agente — no hay build automático en CI.
/// En Docker/Railway el archivo vive en <c>/app/agent/SLCDMAgente.exe</c>
/// (ver Dockerfile). Override: <c>Agent__PublishedExePath</c>.
/// </summary>
public sealed class AgentOptions
{
    public const string SectionName = "Agent";

    /// <summary>
    /// Base pública del API para armar el link de descarga
    /// (ej. https://api.ejemplo.com). Si está vacío, se usa el host del request.
    /// </summary>
    public string DownloadBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// URL que el agente usará como Backend:BaseUrl dentro del ZIP.
    /// Si está vacío, se reutiliza <see cref="DownloadBaseUrl"/>.
    /// </summary>
    public string BackendPublicUrl { get; set; } = string.Empty;

    /// <summary>
    /// Ruta al .exe publicado. Absolute path preferred.
    /// Default: ruta del contenedor Railway/Docker. En desarrollo local,
    /// <c>Program.cs</c> cae a <c>agent/publish/SLCDMAgente.exe</c> si existe.
    /// </summary>
    public string PublishedExePath { get; set; } = "/app/agent/SLCDMAgente.exe";

    public int LinkExpiryHours { get; set; } = 24;
}
