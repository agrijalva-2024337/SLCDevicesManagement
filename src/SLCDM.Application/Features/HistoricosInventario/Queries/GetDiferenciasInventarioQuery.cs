using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;

namespace SLCDM.Application.Features.HistoricosInventario.Queries;

public sealed record DiferenciaInventarioDto(
    int IdActivo,
    string NombreActivo,
    string TipoDiferencia,
    string? Observaciones);

public sealed record GetDiferenciasInventarioQuery(int IdHistoricoInventario);

public sealed class GetDiferenciasInventarioQueryHandler
    : IQueryHandler<GetDiferenciasInventarioQuery, IReadOnlyList<DiferenciaInventarioDto>>
{
    private readonly IApplicationDbContext _db;

    public GetDiferenciasInventarioQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DiferenciaInventarioDto>> HandleAsync(
        GetDiferenciasInventarioQuery query, CancellationToken cancellationToken = default)
    {
        var jornada = await _db.HistoricosInventario.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == query.IdHistoricoInventario, cancellationToken)
            ?? throw new NotFoundException("HistoricoInventario", query.IdHistoricoInventario);

        var idsEsperados = await InventarioJornadaRules.IdsActivosEsperadosAsync(
            _db, jornada.IdSede, cancellationToken);

        var detalles = await _db.DetallesActivos.AsNoTracking()
            .Where(d => d.IdHistoricoInventario == jornada.Id)
            .ToListAsync(cancellationToken);

        var idsVerificados = detalles.Select(d => d.IdActivo).ToHashSet();
        var idsRelevantes = idsEsperados.Concat(idsVerificados).Distinct().ToList();

        var nombresActivos = await _db.Activos.AsNoTracking()
            .Where(a => idsRelevantes.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, a => a.Nombre, cancellationToken);

        string NombreDe(int idActivo) =>
            nombresActivos.TryGetValue(idActivo, out var nombre) ? nombre : "(activo no encontrado)";

        var resultado = new List<DiferenciaInventarioDto>();

        foreach (var idActivo in idsEsperados.Where(id => !idsVerificados.Contains(id)))
        {
            resultado.Add(new DiferenciaInventarioDto(
                idActivo, NombreDe(idActivo), "Faltante",
                "No se registro verificacion para este activo en la jornada."));
        }

        foreach (var detalle in detalles.Where(d => !d.Encontrado))
        {
            resultado.Add(new DiferenciaInventarioDto(
                detalle.IdActivo, NombreDe(detalle.IdActivo), "NoEncontrado", detalle.Observaciones));
        }

        foreach (var detalle in detalles.Where(d => d.Encontrado && !d.BuenEstado))
        {
            resultado.Add(new DiferenciaInventarioDto(
                detalle.IdActivo, NombreDe(detalle.IdActivo), "MalEstado", detalle.Observaciones));
        }

        return resultado;
    }
}