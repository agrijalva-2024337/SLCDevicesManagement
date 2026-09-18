using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Domain.Enums;

namespace SLCDM.Application.Features.HistoricosInventario.Queries;

public sealed record UsuarioJornadaInventarioDto(int Id, string Nombre);

public sealed record GetUsuariosJornadaInventarioQuery(int? IdEmpresa = null);

public sealed class GetUsuariosJornadaInventarioQueryHandler
    : IQueryHandler<GetUsuariosJornadaInventarioQuery, IReadOnlyList<UsuarioJornadaInventarioDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetUsuariosJornadaInventarioQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<UsuarioJornadaInventarioDto>> HandleAsync(
        GetUsuariosJornadaInventarioQuery query,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(_currentUser.Role, Roles.OperadorInventario, StringComparison.OrdinalIgnoreCase))
        {
            return [];
        }

        var q = _db.Usuarios.AsNoTracking()
            .Where(u => u.Habilitado && u.Rol == RolUsuario.OperadorInventario);

        if (!_currentUser.IsAdministradorGeneral)
        {
            var autorizadas = _currentUser.EmpresasAutorizadas;
            q = q.Where(u => _db.UsuariosEmpresas.Any(ue =>
                ue.IdUsuario == u.Id && autorizadas.Contains(ue.IdEmpresa)));
        }

        if (query.IdEmpresa is > 0)
        {
            var idEmpresa = query.IdEmpresa.Value;
            q = q.Where(u => _db.UsuariosEmpresas.Any(ue =>
                ue.IdUsuario == u.Id && ue.IdEmpresa == idEmpresa));
        }

        return await q
            .OrderBy(u => u.Apellidos)
            .ThenBy(u => u.Nombres)
            .Select(u => new UsuarioJornadaInventarioDto(
                u.Id,
                (u.Nombres + " " + u.Apellidos).Trim()))
            .ToListAsync(cancellationToken);
    }
}
