namespace SLCDM.Application.Common.Interfaces;

public interface IPdfHashService
{
    string CalcularHash(byte[] contenidoPdf);
}