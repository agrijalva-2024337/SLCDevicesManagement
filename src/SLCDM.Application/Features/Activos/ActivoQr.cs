using QRCoder;

namespace SLCDM.Application.Features.Activos;

public static class ActivoQr
{
    public static string Url(string publicUrl, string tokenPublico) =>
        $"{publicUrl.TrimEnd('/')}/consulta/{tokenPublico}";

    public static byte[] Png(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
        var png = new PngByteQRCode(data);
        return png.GetGraphic(8);
    }
}
