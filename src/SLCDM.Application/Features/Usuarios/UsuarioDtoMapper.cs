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
        var filas = await db.UsuariosEmpresas.AsNoTracking()
            .Where(ue => ids.Contains(ue.IdUsuario))
            .Select(ue => new { ue.IdUsuario, ue.IdEmpresa })
            .ToListAsync(cancellationToken);

        var porUsuario = filas
            .GroupBy(ue => ue.IdUsuario)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<int>)g.Select(ue => ue.IdEmpresa).Distinct().OrderBy(id => id).ToList());

        return items.Select(u =>
        {
            var idsEmpresas = porUsuario.TryGetValue(u.Id, out var list) ? list : [];
            return new UsuarioDto(
                u.Id,
                u.Habilitado,
                idsEmpresas.Count > 0 ? idsEmpresas[0] : null,
                idsEmpresas,
                u.Nombres,
                u.Apellidos,
                u.Correo,
                u.Username,
                u.Rol,
                u.FechaCreacion);
        }).ToList();
    }
}
