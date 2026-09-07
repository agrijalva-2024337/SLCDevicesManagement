using FluentValidation;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Asignaciones;

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
    private readonly IAsignacionPdfService _pdf;
    private readonly IValidator<GetAsignacionPdfQuery> _validator;

    public GetAsignacionPdfQueryHandler(
        IAsignacionPdfService pdf,
        IValidator<GetAsignacionPdfQuery> validator)
    {
        _pdf = pdf;
        _validator = validator;
    }

    public async Task<AsignacionPdfFileDto> HandleAsync(
        GetAsignacionPdfQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);
        return await _pdf.GenerarAsync(query.Id, cancellationToken);
    }
}