using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;
using SLCDM.Domain.Enums;

namespace SLCDM.Application.Features.Usuarios.Commands;

public sealed record UpdateUsuarioCommand(
    int Id,
    IReadOnlyList<int> IdsEmpresas,
    string Nombres,
    string Apellidos,
    string Correo,
    string Username,
    string? Password,
    RolUsuario Rol,
    bool Habilitado);

public sealed class UpdateUsuarioCommandValidator : AbstractValidator<UpdateUsuarioCommand>
{
    public UpdateUsuarioCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        RuleFor(x => x.Id).RequiredId("id usuario");

        RuleFor(x => x.IdsEmpresas)
            .Must((cmd, ids) => cmd.Rol == RolUsuario.AdministradorGeneral || (ids?.Count ?? 0) > 0)
            .WithMessage("El campo ids empresas es obligatorio para este rol.");

        RuleFor(x => x.IdsEmpresas)
            .Must(ids => (ids ?? []).All(id => id > 0))
            .WithMessage("El campo ids empresas debe ser mayor a 0 cuando se informa.");

        RuleFor(x => x.IdsEmpresas)
            .MustAsync(async (ids, ct) =>
            {
                var list = UsuarioEmpresaList.Normalize(ids);
                if (list.Count == 0)
                {
                    return true;
                }

                var existentes = await db.Empresas.CountAsync(e => list.Contains(e.Id), ct);
                return existentes == list.Count;
            })
            .WithMessage("El campo ids empresas no corresponde a un registro existente.");

        RuleFor(x => x.IdsEmpresas)
            .Must(ids => (ids ?? []).All(id => currentUser.TieneAccesoAEmpresa(id)))
            .WithMessage("Solo puede asignar usuarios a sus empresas autorizadas.")
            .When(_ => !currentUser.IsAdministradorGeneral);

        RuleFor(x => x.Nombres)
            .NotEmpty().WithMessage("El campo nombres es obligatorio.")
            .MaximumLength(100).WithMessage("El campo nombres no debe superar los 100 caracteres.");

        RuleFor(x => x.Apellidos)
            .NotEmpty().WithMessage("El campo apellidos es obligatorio.")
            .MaximumLength(100).WithMessage("El campo apellidos no debe superar los 100 caracteres.");

        RuleFor(x => x.Correo)
            .NotEmpty().WithMessage("El campo correo es obligatorio.")
            .MaximumLength(150).WithMessage("El campo correo no debe superar los 150 caracteres.")
            .EmailAddress().WithMessage("El formato del correo no es valido.")
            .MustAsync(async (cmd, correo, ct) =>
            {
                var normalized = correo.Trim().ToLowerInvariant();
                return !await db.Usuarios.IgnoreQueryFilters()
                    .AnyAsync(u => u.Correo.ToLower() == normalized && u.Id != cmd.Id, ct);
            })
            .WithMessage("Ya existe un usuario con el mismo correo.");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("El campo username es obligatorio.")
            .MaximumLength(50).WithMessage("El campo username no debe superar los 50 caracteres.")
            .MustAsync(async (cmd, username, ct) =>
                !await db.Usuarios.IgnoreQueryFilters()
                    .AnyAsync(u => u.Username == username && u.Id != cmd.Id, ct))
            .WithMessage("Ya existe un usuario con el mismo username.");

        RuleFor(x => x.Password)
            .MinimumLength(8).WithMessage("El campo password debe tener al menos 8 caracteres.")
            .MaximumLength(128).WithMessage("El campo password no debe superar los 128 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Password));

        RuleFor(x => x.Rol)
            .IsInEnum().WithMessage("El campo rol no es un valor valido.")
            .Must(rol => currentUser.IsAdministradorGeneral || rol != RolUsuario.AdministradorGeneral)
            .WithMessage("Solo el administrador general puede asignar ese rol.");
    }
}

public sealed class UpdateUsuarioCommandHandler : ICommandHandler<UpdateUsuarioCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHashService _passwordHashService;
    private readonly IValidator<UpdateUsuarioCommand> _validator;

    public UpdateUsuarioCommandHandler(
        IApplicationDbContext db,
        IPasswordHashService passwordHashService,
        IValidator<UpdateUsuarioCommand> validator)
    {
        _db = db;
        _passwordHashService = passwordHashService;
        _validator = validator;
    }

    public async Task HandleAsync(UpdateUsuarioCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var entity = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken)
            ?? throw new NotFoundException("Usuario", command.Id);

        command.Adapt(entity);
        entity.Correo = command.Correo.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(command.Password))
        {
            entity.PasswordHash = _passwordHashService.HashPassword(command.Password);
        }

        await SyncUsuarioEmpresaAsync(entity.Id, command.IdsEmpresas, command.Rol, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncUsuarioEmpresaAsync(
        int idUsuario,
        IReadOnlyList<int>? idsEmpresas,
        RolUsuario rol,
        CancellationToken cancellationToken)
    {
        var wanted = UsuarioEmpresaList.Normalize(idsEmpresas);
        var wantedSet = wanted.ToHashSet();

        var existentes = await _db.UsuariosEmpresas
            .Where(ue => ue.IdUsuario == idUsuario)
            .ToListAsync(cancellationToken);

        foreach (var fila in existentes.Where(ue => !wantedSet.Contains(ue.IdEmpresa)))
        {
            _db.UsuariosEmpresas.Remove(fila);
        }

        var existentesPorEmpresa = existentes.ToDictionary(ue => ue.IdEmpresa);
        foreach (var id in wanted)
        {
            if (existentesPorEmpresa.TryGetValue(id, out var match))
            {
                match.Rol = rol;
            }
            else
            {
                _db.UsuariosEmpresas.Add(new UsuarioEmpresa
                {
                    IdUsuario = idUsuario,
                    IdEmpresa = id,
                    Rol = rol
                });
            }
        }
    }
}
