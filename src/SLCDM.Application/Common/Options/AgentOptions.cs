namespace SLCDM.Application.Common.Options;

/// <summary>
/// Configuración del paquete descargable del agente de rastreo.
/// Mantener <see cref="PublishedExePath"/> actualizado republicando el agente
/// (`dotnet publish agent/SLCDM.Agent.csproj -c Release -o agent/publish`)
/// cada vez que cambie el código del agente — no hay build automático en CI.
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
    /// Ruta al .exe publicado. Relativa al content root del API o absoluta.
    /// Por defecto apunta al publish del repo: agent/publish/SLCDMAgente.exe
    /// (desde src/SLCDM.Api: ..\..\agent\publish\...).
    /// </summary>
    public string PublishedExePath { get; set; } =
        Path.Combine("..", "..", "agent", "publish", "SLCDMAgente.exe");

    public int LinkExpiryHours { get; set; } = 24;
}
