using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.Asignaciones.Queries;

public sealed record VerificarDocumentoPdfQuery(int IdAsignacion, byte[] ContenidoPdf);

public sealed record VerificacionPdfDto(bool EsValido, DateTime? FechaGeneracionOriginal);

public sealed class VerificarDocumentoPdfQueryHandler
    : IQueryHandler<VerificarDocumentoPdfQuery, VerificacionPdfDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPdfHashService _pdfHash;

    public VerificarDocumentoPdfQueryHandler(IApplicationDbContext db, IPdfHashService pdfHash)
    {
        _db = db;
        _pdfHash = pdfHash;
    }

    public async Task<VerificacionPdfDto> HandleAsync(
        VerificarDocumentoPdfQuery query, CancellationToken cancellationToken = default)
    {
        var asignacion = await _db.Asignaciones.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == query.IdAsignacion, cancellationToken)
            ?? throw new NotFoundException("Asignacion", query.IdAsignacion);

        if (asignacion.DocumentoPdfHash is null)
        {
            return new VerificacionPdfDto(false, null);
        }

        var coincide = _pdfHash.CalcularHash(query.ContenidoPdf) == asignacion.DocumentoPdfHash;
        return new VerificacionPdfDto(coincide, coincide ? asignacion.DocumentoPdfGenerardoEn : null);
    }
}