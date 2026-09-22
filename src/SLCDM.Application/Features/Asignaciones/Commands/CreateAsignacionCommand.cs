using FluentValidation;
using Mapster;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones.Commands;


public sealed record CreateAsignacionCommand(
    int IdActivo,
    int IdUsuario,
    int IdResponsable,
    int IdUbicacion,
    int IdEstado,
    int IdTipoAsignacion,
    DateTime FechaAsignacion,
    string? Observaciones,
    byte[]? FirmaEntrega,
    byte[]? FirmaRecibe,
    DateTime? FechaFirmaEntrega,
    string? DocumentoPdfUrl);

public sealed class CreateAsignacionCommandValidator : AbstractValidator<CreateAsignacionCommand>
{
    public CreateAsignacionCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdActivo)
            .RequiredId("id activo")
            .MustAsync(async (id, ct) => await db.Activos.AnyAsync(a => a.Id == id, ct))
            .WithMessage("No se encontro un activo con el id informado.");

        RuleFor(x => x.IdUsuario)
            .RequiredId("id usuario")
            .MustAsync(async (id, ct) => await db.Usuarios.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro un usuario (quien entrega) con el id informado.");

        RuleFor(x => x.IdResponsable)
            .RequiredId("id responsable")
            .MustAsync(async (id, ct) => await db.Responsables.AnyAsync(r => r.Id == id, ct))
            .WithMessage("No se encontro un responsable (quien recibe) con el id informado.");

        RuleFor(x => x.IdUbicacion)
            .RequiredId("id ubicacion")
            .MustAsync(async (id, ct) => await db.Ubicaciones.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro una ubicacion de uso con el id informado.");

        RuleFor(x => x.IdEstado)
            .RequiredId("id estado")
            .MustAsync(async (id, ct) => await db.Estados.AnyAsync(e => e.Id == id, ct))
            .WithMessage("No se encontro un estado con el id informado.");

        RuleFor(x => x.IdTipoAsignacion)
            .RequiredId("id tipo asignacion")
            .MustAsync(async (cmd, id, ct) =>
            {
                var tipo = await db.TiposAsignacion.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
                if (tipo is null || !TipoAsignacionNombres.EsNombre(tipo.Nombre, TipoAsignacionNombres.Asignacion))
                {
                    return false;
                }

                var empresaActivo = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(db, cmd.IdActivo, ct);
                return empresaActivo is not null && tipo.IdEmpresa == empresaActivo.Value;
            })
            .WithMessage("El tipo de asignacion debe ser «Asignacion» de la misma empresa del activo.");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) => !await ActivoBajaRules.EstaDadoDeBajaAsync(db, cmd.IdActivo, ct))
            .WithMessage(ActivoBajaRules.MensajeActivoDadoDeBaja);

        // Entrega: un activo, una asignacion activa.
        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                !await db.Asignaciones.AnyAsync(a => a.IdActivo == cmd.IdActivo && a.Activa, ct))
            .WithMessage("El activo ya tiene una asignacion activa. Un activo solo puede tener una asignacion activa a la vez.");

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));

        RuleFor(x => x.DocumentoPdfUrl)
            .MaximumLength(300).WithMessage("El campo documento pdf url no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.DocumentoPdfUrl));

        RuleFor(x => x)
            .MustAsync((cmd, ct) => AsignacionEmpresaRules.MismaEmpresaAsync(db, cmd.IdActivo, cmd.IdUbicacion, ct))
            .WithMessage("El activo y la ubicacion deben pertenecer a la misma empresa.");
            
        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
            {
                var empresaActivo = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(db, cmd.IdActivo, ct);
                return await AsignacionEmpresaRules.UsuarioPerteneceAEmpresaAsync(db, cmd.IdUsuario, empresaActivo, ct);
            })
            .WithMessage("El usuario debe pertenecer a la misma empresa del activo.");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
            {
                var empresaActivo = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(db, cmd.IdActivo, ct);
                var empresaResponsable = await AsignacionEmpresaRules.EmpresaIdDeResponsableAsync(db, cmd.IdResponsable, ct);
                return AsignacionEmpresaRules.EmpresasCoinciden(empresaActivo, empresaResponsable);
            })
            .WithMessage("El responsable debe pertenecer a la misma empresa del activo.");
    }
}

public sealed class CreateAsignacionCommandHandler : ICommandHandler<CreateAsignacionCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateAsignacionCommand> _validator;
    private readonly IAsignacionCorreoService _correo;

    public CreateAsignacionCommandHandler(
        IApplicationDbContext db,
        IValidator<CreateAsignacionCommand> validator,
        IAsignacionCorreoService correo)
    {
        _db = db;
        _validator = validator;
        _correo = correo;
    }

    public async Task<int> HandleAsync(CreateAsignacionCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(_db, command.IdActivo, cancellationToken)
            ?? throw new ConflictException("No se pudo determinar la empresa del activo.");

        var tipo = await TipoAsignacionNombres.ObtenerRequeridoAsync(
            _db, TipoAsignacionNombres.Asignacion, idEmpresa, cancellationToken);
        var estadoAsignado = await EstadoActivoNombres.ObtenerRequeridoAsync(
            _db, EstadoActivoNombres.Asignado, idEmpresa, cancellationToken);

        if (await _db.Asignaciones.AnyAsync(a => a.IdActivo == command.IdActivo && a.Activa, cancellationToken))
        {
            throw new ConflictException(
                "El activo ya tiene una asignacion activa. Un activo solo puede tener una asignacion activa a la vez.");
        }

        if (await ActivoBajaRules.EstaDadoDeBajaAsync(_db, command.IdActivo, cancellationToken))
        {
            throw new ConflictException(ActivoBajaRules.MensajeActivoDadoDeBaja);
        }

        var entity = command.Adapt<Asignacion>();
        entity.IdTipoAsignacion = tipo.Id;
        entity.IdEstado = estadoAsignado.Id;
        entity.Activa = true;
        if (entity.FechaAsignacion == default)
        {
            entity.FechaAsignacion = DateTime.UtcNow;
        }

        if (entity.FirmaEntrega is { Length: > 0 } || entity.FirmaRecibe is { Length: > 0 })
        {
            entity.FechaFirmaEntrega ??= DateTime.UtcNow;
        }

        _db.Asignaciones.Add(entity);

        var activo = await _db.Activos.FirstAsync(a => a.Id == command.IdActivo, cancellationToken);
        activo.IdUbicacion = command.IdUbicacion;
        activo.IdEstado = estadoAsignado.Id;

        await _db.SaveChangesAsync(cancellationToken);

        entity.DocumentoPdfUrl = $"/api/Asignaciones/{entity.Id}/pdf";

        _db.HistorialActivos.Add(new HistorialActivo
        {
            IdAsignacion = entity.Id,
            FechaHora = DateTime.UtcNow,
            TipoOperacion = "Creacion",
            Descripcion = "Entrega de activo",
            InformacionNueva = $"Activo {entity.IdActivo} entregado a responsable {entity.IdResponsable} en ubicacion {command.IdUbicacion}."
        });
        await _db.SaveChangesAsync(cancellationToken);

        await _correo.NotificarResponsableAsync(entity.Id, cancellationToken);
        return entity.Id;
    }
}
