using SLCDM.Domain.Enums;

namespace SLCDM.Application.Features.Usuarios;

public sealed record UsuarioDto(
    int Id,
    bool Habilitado,
    int? IdEmpresa,
    string Nombres,
    string Apellidos,
    string Correo,
    string Username,
    RolUsuario Rol,
    DateTime FechaCreacion);
