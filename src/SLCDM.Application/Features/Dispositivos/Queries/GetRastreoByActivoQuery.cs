using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Application.Features.Dispositivos;

namespace SLCDM.Application.Features.Dispositivos.Queries;

public sealed record GetRastreoByActivoQuery(int IdActivo);

public sealed class GetRastreoByActivoQueryValidator : AbstractValidator<GetRastreoByActivoQuery>
{
    public GetRastreoByActivoQueryValidator()
    {
        RuleFor(x => x.IdActivo).RequiredId("id activo");
    }
}

public sealed class GetRastreoByActivoQueryHandler : IQueryHandler<GetRastreoByActivoQuery, DispositivoRastreoDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<GetRastreoByActivoQuery> _validator;

    public GetRastreoByActivoQueryHandler(
        IApplicationDbContext db,
        IValidator<GetRastreoByActivoQuery> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<DispositivoRastreoDto> HandleAsync(
        GetRastreoByActivoQuery query,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(query, cancellationToken);

        var dto = await _db.DispositivosToken.AsNoTracking()
            .Where(d => d.IdActivo == query.IdActivo && !d.Revocado)
            .Include(d => d.Activo)
            .Select(d => new DispositivoRastreoDto(
                d.Id,
                d.IdActivo,
                d.Activo!.Nombre,
                d.Activo.IdUbicacion,
                d.UltimaUbicacionDetectadaId,
                d.UltimoUsoEn,
                d.FueraDeRango,
                d.Revocado,
                d.CreadoEn,
                d.ExpiraEn))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("DispositivoToken", query.IdActivo);

        return dto;
    }
}
