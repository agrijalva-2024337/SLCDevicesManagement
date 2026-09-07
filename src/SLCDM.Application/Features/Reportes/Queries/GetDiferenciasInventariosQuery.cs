using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Features.HistoricosInventario.Queries;

namespace SLCDM.Application.Features.Reportes.Queries;

public sealed record GetDiferenciasInventariosQuery(int? IdEmpresa = null);

public sealed record DiferenciaInventarioReporteDto(
    int IdHistoricoInventario,
    string NombreSede,
    DateTime FechaInicio,
    string TipoDiferencia,
    int IdActivo,
    string NombreActivo,
    string? Observaciones);

// NOTA: este reporte NO trae su propia logica de comparacion de
// inventario -- reusa el GetDiferenciasInventarioQueryHandler real, que
// ya existe desde BE-21 (Features/HistoricosInventario/Queries/GetDiferenciasInventarioQuery.cs).
// El repo de prueba trae un GetDiferenciasInventarioQuery distinto (5
// categorias: EncontradosEnSede/NoEncontrados/Sobrantes/FaltantesSinRegistrar/
// EncontradosEnOtraUbicacion, y asume Activo.IdUbicacion no nulo) que NO
// es compatible con el de este repo (3 categorias: Faltante/NoEncontrado/
// MalEstado, IdUbicacion nullable) -- no se trasplanto, solo se
// construye este reporte encima del que ya existe, recorriendo las
// jornadas cerradas.
public sealed class GetDiferenciasInventariosQueryHandler
    : IQueryHandler<GetDiferenciasInventariosQuery, IReadOnlyList<DiferenciaInventarioReporteDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IQueryHandler<GetDiferenciasInventarioQuery, IReadOnlyList<DiferenciaInventarioDto>> _diferencias;

    public GetDiferenciasInventariosQueryHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IQueryHandler<GetDiferenciasInventarioQuery, IReadOnlyList<DiferenciaInventarioDto>> diferencias)
    {
        _db = db;
        _currentUser = currentUser;
        _diferencias = diferencias;
    }

    public async Task<IReadOnlyList<DiferenciaInventarioReporteDto>> HandleAsync(
        GetDiferenciasInventariosQuery query,
        CancellationToken cancellationToken = default)
    {
        var idEmpresa = ActivoReporteConsulta.EmpresaEfectiva(_currentUser, query.IdEmpresa);

        var jornadasQuery =
            from h in _db.HistoricosInventario.AsNoTracking()
            join s in _db.Sedes.AsNoTracking() on h.IdSede equals s.Id
            where h.Cerrado
            select new { h.Id, h.FechaInicio, NombreSede = s.Nombre, s.IdEmpresa };

        if (idEmpresa.HasValue)
        {
            jornadasQuery = jornadasQuery.Where(x => x.IdEmpresa == idEmpresa.Value);
        }

        var jornadas = await jornadasQuery
            .OrderByDescending(x => x.FechaInicio)
            .ToListAsync(cancellationToken);

        var resultado = new List<DiferenciaInventarioReporteDto>();

        foreach (var jornada in jornadas)
        {
            var diferencias = await _diferencias.HandleAsync(
                new GetDiferenciasInventarioQuery(jornada.Id), cancellationToken);

            resultado.AddRange(diferencias.Select(d => new DiferenciaInventarioReporteDto(
                jornada.Id,
                jornada.NombreSede,
                jornada.FechaInicio,
                d.TipoDiferencia,
                d.IdActivo,
                d.NombreActivo,
                d.Observaciones)));
        }

        return resultado;
    }
}
