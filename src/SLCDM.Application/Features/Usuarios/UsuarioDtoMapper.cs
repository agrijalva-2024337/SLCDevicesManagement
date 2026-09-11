using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Usuarios;

internal static class UsuarioDtoMapper
{
    public static async Task<IReadOnlyList<UsuarioDto>> MapAsync(
        IApplicationDbContext db,
        IReadOnlyList<Usuario> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return [];
        }

        var ids = items.Select(u => u.Id).ToList();
        var primeraEmpresa = await db.UsuariosEmpresas.AsNoTracking()
            .Where(ue => ids.Contains(ue.IdUsuario))
            .GroupBy(ue => ue.IdUsuario)
            .Select(g => new { IdUsuario = g.Key, IdEmpresa = g.Min(ue => ue.IdEmpresa) })
            .ToDictionaryAsync(x => x.IdUsuario, x => x.IdEmpresa, cancellationToken);

        return items.Select(u =>
        {
            var dto = u.Adapt<UsuarioDto>();
            return dto with
            {
                IdEmpresa = primeraEmpresa.TryGetValue(u.Id, out var idEmpresa) ? idEmpresa : null
            };
        }).ToList();
    }
}
