using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Asignaciones.Queries;

public sealed record GetAsignacionPdfQuery(int Id);

public sealed class GetAsignacionPdfQueryValidator : AbstractValidator<GetAsignacionPdfQuery>
{
    public GetAsignacionPdfQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id asignacion");
    }
}

public sealed class GetAsignacionPdfQueryHandler : IQueryHandler<GetAsignacionPdfQuery, AsignacionPdfFileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IAsignacionPdfService _pdf;
    private readonly IPdfHashService _pdfHash;
    private readonly IValidator<GetAsignacionPdfQuery> _validator;

    public GetAsignacionPdfQueryHandler(
        IApplicationDbContext db,
        IAsignacionPdfService pdf,
        IPdfHashService pdfHash,
        IValidator<GetAsignacionPdfQuery> validator)
    {
        _db = db;
        _pdf = pdf;
        _pdfHash = pdfHash;
        _validator = validator;
    }

    public async Task<AsignacionPdfFileDto> HandleAsync(
        GetAsignacionPdfQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var tracked = await _db.Asignaciones.FirstOrDefaultAsync(a => a.Id == query.Id, cancellationToken);

        // Se congela la primera vez que se genera el PDF (DocumentoPdfGenerardoEn)
        // y se reutiliza en cada descarga posterior -- si no, cada descarga
        // metería una hora distinta en el pie de pagina, el PDF nunca volvería
        // a ser byte-por-byte igual, y el hash guardado dejaría de coincidir
        // con cualquier descarga futura del mismo acta (ver nota en la sección 0).
        var marcaTemporal = tracked?.DocumentoPdfGenerardoEn ?? DateTime.UtcNow;

        var file = await _pdf.GenerarAsync(query.Id, marcaTemporal, cancellationToken);

        if (tracked is not null && tracked.DocumentoPdfGenerardoEn is null)
        {
            tracked.DocumentoPdfUrl ??= $"/api/asignaciones/{tracked.Id}/pdf";
            tracked.DocumentoPdfHash = _pdfHash.CalcularHash(file.Content);
            tracked.DocumentoPdfGenerardoEn = marcaTemporal;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return file;
    }
}