namespace SLCDM.Application.Features.Responsables.Commands;

/// <summary>
/// Normaliza DPI guatemalteco: quita espacios/guiones y exige 13 dígitos al validar.
/// </summary>
internal static class DpiNormalizer
{
    public static string Clean(string? dpi)
    {
        if (string.IsNullOrWhiteSpace(dpi))
        {
            return string.Empty;
        }

        return dpi.Replace(" ", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Trim();
    }

    public static string? Normalize(string? dpi)
    {
        var cleaned = Clean(dpi);
        return string.IsNullOrEmpty(cleaned) ? null : cleaned;
    }

    public static bool IsValid(string? dpi)
    {
        var cleaned = Clean(dpi);
        return cleaned.Length == 13 && cleaned.All(char.IsDigit);
    }
}
