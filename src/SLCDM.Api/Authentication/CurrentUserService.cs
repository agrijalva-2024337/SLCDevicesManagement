using System.Security.Claims;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;

namespace SLCDM.Api.Authentication;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private IReadOnlyList<int>? _empresasAutorizadas;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public int? UserId => ParseInt(Find(AuthClaimTypes.Sub) ?? Find(ClaimTypes.NameIdentifier));

    public string? Username => Find(AuthClaimTypes.Name) ?? User?.Identity?.Name;

    public string? Role => Find(AuthClaimTypes.Role) ?? Find(ClaimTypes.Role);

    public IReadOnlyList<int> EmpresasAutorizadas => _empresasAutorizadas ??= ReadEmpresasAutorizadas();

    /// <summary>
    /// Primera empresa autorizada (compatibilidad con código que espera una sola).
    /// Null si no hay claims de empresa (p. ej. AdministradorGeneral).
    /// </summary>
    public int? EmpresaId => EmpresasAutorizadas.Count > 0 ? EmpresasAutorizadas[0] : null;

    public bool IsAdministradorGeneral =>
        User?.IsInRole(Roles.AdministradorGeneral) == true
        || string.Equals(Role, Roles.AdministradorGeneral, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Equivalente sincrónico a consultar usuario_empresa: las empresas ya vienen
    /// en el JWT (rellenadas en login desde la tabla puente). Evita DbContext ↔ CurrentUser circular.
    /// </summary>
    public IReadOnlyList<int> GetEmpresasAutorizadas() => EmpresasAutorizadas;

    private IReadOnlyList<int> ReadEmpresasAutorizadas()
    {
        if (User is null)
        {
            return [];
        }

        return User.FindAll(AuthClaimTypes.IdEmpresa)
            .Select(c => c.Value)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Select(v => int.TryParse(v, out var id) ? id : (int?)null)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();
    }

    private string? Find(string claimType) => User?.FindFirstValue(claimType);

    private static int? ParseInt(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return int.TryParse(value, out var parsed) ? parsed : null;
    }
}
