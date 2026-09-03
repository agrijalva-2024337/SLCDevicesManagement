using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones.Commands;

public sealed record CreateMantenimientoCommand(
    int IdActivo,
    int IdUsuario,
    int IdResponsable,
    int IdEstado,
    int IdTipoMantenimiento,
    string DescripcionProblema,
    DateTime FechaAsignacion,
    string? Observaciones);

public sealed class CreateMantenimientoCommandValidator : AbstractValidator<CreateMantenimientoCommand>
{
    public CreateMantenimientoCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdActivo)
            .RequiredId("id activo")
            .MustAsync(async (id, ct) => await db.Activos.AnyAsync(a => a.Id == id, ct))
            .WithMessage("No se encontro un activo con el id informado.");

        RuleFor(x => x.IdUsuario)
            .RequiredId("id usuario")
            .MustAsync(async (id, ct) => await db.Usuarios.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro un usuario con el id informado.");

        RuleFor(x => x.IdResponsable)
            .RequiredId("id responsable")
            .MustAsync(async (id, ct) => await db.Responsables.AnyAsync(r => r.Id == id, ct))
            .WithMessage("No se encontro un responsable con el id informado.");

        RuleFor(x => x.IdEstado)
            .RequiredId("id estado")
            .MustAsync(async (id, ct) => await db.Estados.AnyAsync(e => e.Id == id, ct))
            .WithMessage("No se encontro un estado con el id informado.");

        RuleFor(x => x.IdTipoMantenimiento)
            .RequiredId("id tipo mantenimiento")
            .MustAsync(async (id, ct) => await db.TiposMantenimiento.AnyAsync(t => t.Id == id, ct))
            .WithMessage("No se encontro un tipo de mantenimiento con el id informado.");

        RuleFor(x => x.DescripcionProblema)
            .NotEmpty().WithMessage("La descripcion del problema es obligatoria.")
            .MaximumLength(300).WithMessage("El campo descripcion del problema no debe superar los 300 caracteres.");

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) => !await ActivoBajaRules.EstaDadoDeBajaAsync(db, cmd.IdActivo, ct))
            .WithMessage(ActivoBajaRules.MensajeActivoDadoDeBaja);

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) => !await ActivoTieneProcesoOcupandoAsync(db, cmd.IdActivo, ct))
            .WithMessage("El activo ya tiene una asignacion o un mantenimiento activo. Un activo solo puede tener un proceso ocupandolo a la vez.");
    }

    internal static async Task<bool> ActivoTieneProcesoOcupandoAsync(
        IApplicationDbContext db,
        int idActivo,
        CancellationToken cancellationToken)
    {
        var tipos = await db.TiposAsignacion.AsNoTracking().ToListAsync(cancellationToken);
        var idsOcupan = tipos
            .Where(t => TipoAsignacionNombres.EsTipoQueOcupaActivo(t.Nombre))
            .Select(t => t.Id)
            .ToList();

        if (idsOcupan.Count == 0)
        {
            return false;
        }

        return await db.Asignaciones.AnyAsync(
            a => a.IdActivo == idActivo && a.Activa && idsOcupan.Contains(a.IdTipoAsignacion),
            cancellationToken);
    }
}

public sealed class CreateMantenimientoCommandHandler : ICommandHandler<CreateMantenimientoCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateMantenimientoCommand> _validator;

    public CreateMantenimientoCommandHandler(IApplicationDbContext db, IValidator<CreateMantenimientoCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateMantenimientoCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var tipo = await TipoAsignacionNombres.ObtenerRequeridoAsync(_db, TipoAsignacionNombres.Mantenimiento, cancellationToken);

        if (await ActivoBajaRules.EstaDadoDeBajaAsync(_db, command.IdActivo, cancellationToken))
        {
            throw new ConflictException(ActivoBajaRules.MensajeActivoDadoDeBaja);
        }

        if (await CreateMantenimientoCommandValidator.ActivoTieneProcesoOcupandoAsync(_db, command.IdActivo, cancellationToken))
        {
            throw new ConflictException(
                "El activo ya tiene una asignacion o un mantenimiento activo. Un activo solo puede tener un proceso ocupandolo a la vez.");
        }

        var fecha = command.FechaAsignacion == default ? DateTime.UtcNow : command.FechaAsignacion;

        var entity = new Asignacion
        {
            IdActivo = command.IdActivo,
            IdUsuario = command.IdUsuario,
            IdResponsable = command.IdResponsable,
            IdEstado = command.IdEstado,
            IdTipoAsignacion = tipo.Id,
            FechaAsignacion = fecha,
            Activa = true,
            Observaciones = command.Observaciones
        };

        _db.Asignaciones.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        _db.DetallesMantenimiento.Add(new DetalleMantenimiento
        {
            IdAsignacion = entity.Id,
            IdTipoMantenimiento = command.IdTipoMantenimiento,
            DescripcionProblema = command.DescripcionProblema
        });

        var activo = await _db.Activos.FirstAsync(a => a.Id == command.IdActivo, cancellationToken);
        var estadoEnMantenimiento = await EstadoActivoNombres.ObtenerRequeridoAsync(
            _db, EstadoActivoNombres.EnMantenimiento, cancellationToken);
        activo.IdEstado = estadoEnMantenimiento.Id;

        await _db.SaveChangesAsync(cancellationToken);

        _db.HistorialActivos.Add(new HistorialActivo
        {
            IdAsignacion = entity.Id,
            FechaHora = DateTime.UtcNow,
            TipoOperacion = "Mantenimiento",
            Descripcion = "Inicio de mantenimiento",
            InformacionNueva = $"id_tipo_mantenimiento={command.IdTipoMantenimiento}; descripcion_problema={command.DescripcionProblema}"
        });
        await _db.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}