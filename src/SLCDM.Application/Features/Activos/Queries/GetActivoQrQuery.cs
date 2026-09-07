using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;

namespace SLCDM.Application.Features.Activos.Queries;

public sealed record GetActivoQrQuery(int Id);

public sealed record ActivoQrFileDto(byte[] Content, string FileName);

public sealed class GetActivoQrQueryValidator : AbstractValidator<GetActivoQrQuery>
{
    public GetActivoQrQueryValidator()
    {
        RuleFor(x => x.Id).RequiredId("id activo");
    }
}

public sealed class GetActivoQrQueryHandler : IQueryHandler<GetActivoQrQuery, ActivoQrFileDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IValidator<GetActivoQrQuery> _validator;

    public GetActivoQrQueryHandler(
        IApplicationDbContext db, IConfiguration configuration, IValidator<GetActivoQrQuery> validator)
    {
        _db = db;
        _configuration = configuration;
        _validator = validator;
    }

    public async Task<ActivoQrFileDto> HandleAsync(GetActivoQrQuery query, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var activo = await _db.Activos.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException("Activo", query.Id);

        var publicUrl = _configuration["Frontend:PublicUrl"] ?? "http://localhost:5173";
        var url = ActivoQr.Url(publicUrl, activo.TokenPublico);
        var png = ActivoQr.Png(url);

        return new ActivoQrFileDto(png, $"qr-activo-{activo.Id}.png");
    }
}
