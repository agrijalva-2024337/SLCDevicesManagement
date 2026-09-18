using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Security;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;
using SLCDM.Domain.Enums;

namespace SLCDM.Application.Features.HistoricosInventario.Commands;

/// <summary>
/// Apertura de jornada de inventario fisico (BE-20) por sede.
/// No clona activos: el operador registra hallazgos en <c>Detalle_Activo</c>.
/// El universo teorico al cierre son los activos cuya <c>Ubicacion.IdSede</c>
/// coincide con la jornada y que no estan dados de baja
/// (<see cref="Asignaciones.ActivoBajaRules.EstaDadoDeBajaAsync"/>).
/// <para>
/// El operador de inventario no elige responsable: la jornada queda a su nombre.
/// Administrador de empresa y administrador general asignan un operador habilitado.
/// </para>
/// </summary>
public sealed record CreateHistoricoInventarioCommand(
    int IdSede,
    int? IdUsuario,
    DateTime FechaInicio,
    string? Observaciones);

public sealed class CreateHistoricoInventarioCommandValidator : AbstractValidator<CreateHistoricoInventarioCommand>
{
    public CreateHistoricoInventarioCommandValidator(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        RuleFor(x => x.IdSede)
            .RequiredId("id sede")
            .MustAsync(async (id, ct) => await db.Sedes.AnyAsync(s => s.Id == id, ct))
            .WithMessage("No se encontro una sede con el id informado.")
            .MustAsync(async (id, ct) =>
                !await db.HistoricosInventario.AnyAsync(h => h.IdSede == id && !h.Cerrado, ct))
            .WithMessage("Ya existe una jornada de inventario abierta para esta sede.");

        When(_ => !EsOperadorInventario(currentUser), () =>
        {
            RuleFor(x => x.IdUsuario)
                .NotNull()
                .WithMessage("Seleccione un usuario operador de inventario.")
                .Must(id => id is > 0)
                .WithMessage("Seleccione un usuario operador de inventario.")
                .MustAsync(async (id, ct) =>
                {
                    if (id is not > 0)
                    {
                        return false;
                    }

                    var usuario = await db.Usuarios.AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Id == id.Value, ct);
                    return usuario is { Habilitado: true, Rol: RolUsuario.OperadorInventario };
                })
                .WithMessage("Seleccione un usuario operador de inventario.");

            RuleFor(x => x)
                .MustAsync(async (cmd, ct) =>
                {
                    var sede = await db.Sedes.AsNoTracking()
                        .FirstOrDefaultAsync(s => s.Id == cmd.IdSede, ct);
                    if (sede is null)
                    {
                        return true;
                    }

                    return await db.UsuariosEmpresas.AnyAsync(
                        ue => ue.IdUsuario == cmd.IdUsuario && ue.IdEmpresa == sede.IdEmpresa,
                        ct);
                })
                .WithMessage("El usuario no pertenece a la empresa de la sede.")
                .When(cmd => cmd.IdSede > 0 && cmd.IdUsuario is > 0);
        });

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));
    }

    internal static bool EsOperadorInventario(ICurrentUserService currentUser) =>
        string.Equals(currentUser.Role, Roles.OperadorInventario, StringComparison.OrdinalIgnoreCase);
}

public sealed class CreateHistoricoInventarioCommandHandler : ICommandHandler<CreateHistoricoInventarioCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IValidator<CreateHistoricoInventarioCommand> _validator;

    public CreateHistoricoInventarioCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IValidator<CreateHistoricoInventarioCommand> validator)
    {
        _db = db;
        _currentUser = currentUser;
        _validator = validator;
    }

    public async Task<int> HandleAsync(
        CreateHistoricoInventarioCommand command,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var sede = await _db.Sedes.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == command.IdSede, cancellationToken)
            ?? throw new NotFoundException("Sede", command.IdSede);

        if (!_currentUser.IsAdministradorGeneral
            && !_currentUser.TieneAccesoAEmpresa(sede.IdEmpresa))
        {
            throw new ConflictException("La sede no pertenece a las empresas autorizadas del usuario.");
        }

        if (await _db.HistoricosInventario.AnyAsync(h => h.IdSede == command.IdSede && !h.Cerrado, cancellationToken))
        {
            throw new ConflictException("Ya existe una jornada de inventario abierta para esta sede.");
        }

        var esOperador = CreateHistoricoInventarioCommandValidator.EsOperadorInventario(_currentUser);
        var idUsuario = esOperador ? _currentUser.UserId : command.IdUsuario;
        if (idUsuario is not > 0)
        {
            throw new ConflictException("No se pudo determinar el usuario responsable de la jornada.");
        }

        var usuario = await _db.Usuarios.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == idUsuario.Value, cancellationToken)
            ?? throw new NotFoundException("Usuario", idUsuario.Value);

        var entity = command.Adapt<HistoricoInventario>();
        entity.Responsable = $"{usuario.Nombres} {usuario.Apellidos}".Trim();
        entity.Cerrado = false;
        if (entity.FechaInicio == default)
        {
            entity.FechaInicio = DateTime.UtcNow;
        }

        _db.HistoricosInventario.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }
}
