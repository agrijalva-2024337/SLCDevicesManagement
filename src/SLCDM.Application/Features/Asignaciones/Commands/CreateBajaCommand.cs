using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SLCDM.Application.Common.Exceptions;
using SLCDM.Application.Common.Interfaces;
using SLCDM.Application.Common.Validation;
using SLCDM.Domain.Entities;

namespace SLCDM.Application.Features.Asignaciones.Commands;

public sealed record CreateBajaCommand(
    int IdActivo,
    int IdUsuario,
    int IdEstado,
    int IdMotivoBaja,
    int IdAutorizadoPor,
    DateTime FechaAsignacion,
    string? Observaciones);

public sealed class CreateBajaCommandValidator : AbstractValidator<CreateBajaCommand>
{
    public CreateBajaCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.IdActivo)
            .RequiredId("id activo")
            .MustAsync(async (id, ct) => await db.Activos.AnyAsync(a => a.Id == id, ct))
            .WithMessage("No se encontro un activo con el id informado.");

        RuleFor(x => x.IdUsuario)
            .RequiredId("id usuario")
            .MustAsync(async (id, ct) => await db.Usuarios.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro un usuario con el id informado.");

        RuleFor(x => x.IdEstado)
            .RequiredId("id estado")
            .MustAsync(async (id, ct) => await db.Estados.AnyAsync(e => e.Id == id, ct))
            .WithMessage("No se encontro un estado con el id informado.");

        RuleFor(x => x.IdMotivoBaja)
            .RequiredId("id motivo de baja")
            .MustAsync(async (id, ct) => await db.MotivosBaja.AnyAsync(m => m.Id == id, ct))
            .WithMessage("No se encontro un motivo de baja con el id informado.");

        RuleFor(x => x.IdAutorizadoPor)
            .RequiredId("id autorizado por")
            .MustAsync(async (id, ct) => await db.Usuarios.AnyAsync(u => u.Id == id, ct))
            .WithMessage("No se encontro un usuario autorizador con el id informado.");

        RuleFor(x => x.Observaciones)
            .MaximumLength(300).WithMessage("El campo observaciones no debe superar los 300 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.Observaciones));

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
                return await AsignacionEmpresaRules.UsuarioPerteneceAEmpresaAsync(
                    db, cmd.IdAutorizadoPor, empresaActivo, ct);
            })
            .WithMessage("Quien autoriza debe pertenecer a la misma empresa del activo.");
    }
}

public sealed class CreateBajaCommandHandler : ICommandHandler<CreateBajaCommand, int>
{
    private readonly IApplicationDbContext _db;
    private readonly IValidator<CreateBajaCommand> _validator;

    public CreateBajaCommandHandler(
        IApplicationDbContext db,
        IValidator<CreateBajaCommand> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<int> HandleAsync(CreateBajaCommand command, CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        var idEmpresa = await AsignacionEmpresaRules.EmpresaIdDeActivoAsync(_db, command.IdActivo, cancellationToken)
            ?? throw new ConflictException("No se pudo determinar la empresa del activo.");

        var tipo = await TipoAsignacionNombres.ObtenerRequeridoAsync(
            _db, TipoAsignacionNombres.Baja, idEmpresa, cancellationToken);

        var activo = await _db.Activos.FirstOrDefaultAsync(a => a.Id == command.IdActivo, cancellationToken)
            ?? throw new NotFoundException("Activo", command.IdActivo);

        if (await ActivoBajaRules.EstaDadoDeBajaAsync(_db, command.IdActivo, cancellationToken))
        {
            throw new ConflictException("El activo ya esta dado de baja.");
        }

        if (await ActivoTieneProcesoOcupandoAsync(command.IdActivo, idEmpresa, cancellationToken))
        {
            throw new ConflictException(
                "El activo tiene una asignacion o un mantenimiento activo. Cierren el proceso antes de dar de baja.");
        }

        var fecha = command.FechaAsignacion == default ? DateTime.UtcNow : command.FechaAsignacion;

        var entity = new Asignacion
        {
            IdActivo = command.IdActivo,
            IdUsuario = command.IdUsuario,
            IdResponsable = null,
            IdEstado = command.IdEstado,
            IdTipoAsignacion = tipo.Id,
            FechaAsignacion = fecha,
            Activa = true,
            Observaciones = command.Observaciones
        };

        _db.Asignaciones.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        _db.DetallesBaja.Add(new DetalleBaja
        {
            IdAsignacion = entity.Id,
            IdMotivoBaja = command.IdMotivoBaja,
            IdAutorizadoPor = command.IdAutorizadoPor
        });

        var estadoDadoDeBaja = await EstadoActivoNombres.ObtenerRequeridoAsync(
            _db, EstadoActivoNombres.DadoDeBaja, idEmpresa, cancellationToken);
        activo.IdEstado = estadoDadoDeBaja.Id;

        var tokens = await _db.DispositivosToken
            .Where(t => t.IdActivo == command.IdActivo && !t.Revocado)
            .ToListAsync(cancellationToken);
        foreach (var token in tokens)
        {
            token.Revocado = true;
        }

        entity.DocumentoPdfUrl = $"/api/Asignaciones/{entity.Id}/pdf";

        await _db.SaveChangesAsync(cancellationToken);

        _db.HistorialActivos.Add(new HistorialActivo
        {
            IdAsignacion = entity.Id,
            FechaHora = DateTime.UtcNow,
            TipoOperacion = "Baja",
            Descripcion = "Baja de activo",
            InformacionAnterior = $"id_activo={command.IdActivo}",
            InformacionNueva =
                $"id_motivo_baja={command.IdMotivoBaja}; id_autorizado_por={command.IdAutorizadoPor}; id_usuario={command.IdUsuario}"
        });
        await _db.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }

    private async Task<bool> ActivoTieneProcesoOcupandoAsync(
        int idActivo,
        int idEmpresa,
        CancellationToken cancellationToken)
    {
        var tipos = await _db.TiposAsignacion.AsNoTracking()
            .Where(t => t.IdEmpresa == idEmpresa)
            .ToListAsync(cancellationToken);
        var idsOcupan = tipos
            .Where(t => TipoAsignacionNombres.EsTipoQueOcupaActivo(t.Nombre))
            .Select(t => t.Id)
            .ToList();

        if (idsOcupan.Count == 0)
        {
            return false;
        }

        return await _db.Asignaciones.AnyAsync(
            a => a.IdActivo == idActivo && a.Activa && idsOcupan.Contains(a.IdTipoAsignacion),
            cancellationToken);
    }
}