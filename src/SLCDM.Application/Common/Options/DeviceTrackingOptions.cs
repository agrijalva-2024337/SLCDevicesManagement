namespace SLCDM.Application.Common.Options;

public sealed class DeviceTrackingOptions
{
    public const string SectionName = "DeviceTracking";

    public string Pepper { get; set; } = string.Empty;

    public string InstallKey { get; set; } = string.Empty;

    public int TokenExpiryDays { get; set; } = 365;
}