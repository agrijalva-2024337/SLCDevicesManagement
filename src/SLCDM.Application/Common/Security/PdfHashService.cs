using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Options;

namespace SLCDM.Application.Common.Security;

public sealed class PdfHashService : IPdfHashService
{
    private readonly byte[] _pepper;

    public PdfHashService(IOptions<DocumentIntegrityOptions> options)
    {
        if (string.IsNullOrWhiteSpace(options.Value.Pepper) || options.Value.Pepper.Length < 32)
        {
            throw new InvalidOperationException(
                "DocumentIntegrity:Pepper debe tener al menos 32 caracteres. Use User Secrets en produccion.");
        }

        _pepper = Encoding.UTF8.GetBytes(options.Value.Pepper);
    }

    public string CalcularHash(byte[] contenidoPdf)
    {
        using var hmac = new HMACSHA256(_pepper);
        return Convert.ToHexString(hmac.ComputeHash(contenidoPdf));
    }
}