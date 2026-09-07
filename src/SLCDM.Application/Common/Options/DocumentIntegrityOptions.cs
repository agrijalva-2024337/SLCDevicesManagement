namespace SLCDM.Application.Common.Options;

public sealed class DocumentIntegrityOptions
{
    public const string SectionName = "DocumentIntegrity";
    public string Pepper { get; set; } = string.Empty;
}